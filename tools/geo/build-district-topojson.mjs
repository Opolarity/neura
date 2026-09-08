// Parte el TopoJSON nacional de distritos en un archivo por departamento y lo
// cuantiza. Se corre a mano cuando cambie la fuente:
//
//   node tools/geo/build-district-topojson.mjs
//
// Entrada : tools/geo/peru-districts.source.json  (1815 distritos, sin cuantizar)
// Salida  : src/assets/geo/districts/<DEPARTAMENTO>.json
//
// Por que partirlo: el mapa de calor solo pinta una provincia a la vez, pero el
// archivo nacional obliga a bajar 1.3 MB para hacerlo. Cada departamento pesa
// dos ordenes de magnitud menos y se carga en demanda.
//
// Por que cuantizar: la fuente guarda coordenadas como floats absolutos, que es
// el formato mas caro que existe. TopoJSON puede guardar enteros pequenos
// relativos a una grilla (transform + delta encoding); topojson-client
// deshace la transformacion al leer, asi que el consumidor no cambia.
// La grilla se calcula sobre el bbox de CADA departamento, no del pais, asi
// que a igual numero de pasos la resolucion es mucho mas fina.

import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const SOURCE = resolve(ROOT, 'tools/geo/peru-districts.source.json');
const OUT_DIR = resolve(ROOT, 'src/assets/geo/districts');
const OBJECT_NAME = 'peru_distritos';

// Pasos de la grilla de cuantizacion. 1e5 sobre el bbox de un departamento deja
// un paso muy por debajo de los 4 decimales que trae la fuente, asi que no
// pierde nada de lo que hay.
const QUANT = 1e5;

// Misma normalizacion que usa SalesHeatmap para casar BD ↔ TopoJSON: sin
// tildes, sin Ñ y sin nada que no sea alfanumerico. Es lo que da el nombre del
// archivo, por eso tiene que coincidir exactamente.
const normGeo = (s) =>
  (s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');

const topo = JSON.parse(readFileSync(SOURCE, 'utf8'));
const geometries = topo.objects[OBJECT_NAME].geometries;

// --- 1. Agrupar los distritos por departamento -----------------------------
const byDept = new Map();
for (const geom of geometries) {
  const key = normGeo(geom.properties.NOMBDEP);
  if (!byDept.has(key)) byDept.set(key, []);
  byDept.get(key).push(geom);
}

// --- 2. Recolectar y reindexar los arcos de cada grupo ---------------------
// Un indice negativo ~i referencia el arco i recorrido al reves; hay que
// preservar ese signo al reindexar o los poligonos se abren.
function remapArcs(geoms, arcIndex) {
  const walk = (node) => {
    if (typeof node[0] === 'number') {
      return node.map((idx) => {
        const original = idx < 0 ? ~idx : idx;
        if (!arcIndex.has(original)) arcIndex.set(original, arcIndex.size);
        const mapped = arcIndex.get(original);
        return idx < 0 ? ~mapped : mapped;
      });
    }
    return node.map(walk);
  };
  return geoms.map((geom) => ({ ...geom, arcs: walk(geom.arcs) }));
}

// --- 3. Cuantizar: floats absolutos → enteros delta sobre una grilla -------
function quantize(arcs) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const arc of arcs) {
    for (const [x, y] of arc) {
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
  }
  // Un departamento degenerado (un solo punto) haria una escala de 0.
  const scaleX = (maxX - minX) / (QUANT - 1) || 1;
  const scaleY = (maxY - minY) / (QUANT - 1) || 1;

  const encoded = arcs.map((arc) => {
    const out = [];
    let prevX = 0, prevY = 0;
    for (const [x, y] of arc) {
      const qx = Math.round((x - minX) / scaleX);
      const qy = Math.round((y - minY) / scaleY);
      const dx = qx - prevX;
      const dy = qy - prevY;
      prevX = qx; prevY = qy;
      // Tras redondear puede haber puntos repetidos: no aportan forma y
      // engordan el archivo. Se descartan salvo que dejen el arco sin los dos
      // puntos que necesita para seguir siendo una linea.
      if (dx === 0 && dy === 0 && out.length > 1) continue;
      out.push([dx, dy]);
    }
    return out.length >= 2 ? out : [[0, 0], [0, 0]];
  });

  return {
    transform: { scale: [scaleX, scaleY], translate: [minX, minY] },
    arcs: encoded,
    bbox: [minX, minY, maxX, maxY],
  };
}

// --- 4. Escribir un archivo por departamento -------------------------------
mkdirSync(OUT_DIR, { recursive: true });
for (const file of readdirSync(OUT_DIR)) {
  if (file.endsWith('.json')) rmSync(resolve(OUT_DIR, file));
}

const report = [];
for (const [key, geoms] of [...byDept].sort(([a], [b]) => a.localeCompare(b))) {
  const arcIndex = new Map();
  const remapped = remapArcs(geoms, arcIndex);
  const arcs = [...arcIndex.keys()].map((original) => topo.arcs[original]);
  const { transform, arcs: encodedArcs, bbox } = quantize(arcs);

  const out = {
    type: 'Topology',
    bbox,
    transform,
    objects: { [OBJECT_NAME]: { type: 'GeometryCollection', geometries: remapped } },
    arcs: encodedArcs,
  };

  const json = JSON.stringify(out);
  writeFileSync(resolve(OUT_DIR, `${key}.json`), json);
  report.push({ departamento: key, distritos: geoms.length, KB: +(json.length / 1024).toFixed(1) });
}

const totalKB = report.reduce((acc, r) => acc + r.KB, 0);
console.table(report);
console.log(`${report.length} archivos, ${totalKB.toFixed(1)} KB en total`);
console.log(`fuente: ${(readFileSync(SOURCE).length / 1024).toFixed(1)} KB`);
