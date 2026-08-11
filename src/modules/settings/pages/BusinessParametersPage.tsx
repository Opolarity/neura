import { useRef } from 'react';
import { Plus, Save, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import useBusinessParameters from '../hooks/useBusinessParameters';
import { BUSINESS_SECTIONS, type BusinessField } from '../types/BusinessParameters.types';

const BusinessParametersPage = () => {
    const {
        loading,
        saving,
        uploading,
        formData,
        advancedRows,
        handleChange,
        handleLogoUpload,
        handleAdvancedChange,
        addAdvancedRow,
        removeAdvancedRow,
        handleSubmit,
    } = useBusinessParameters();

    const fileInputRef = useRef<HTMLInputElement>(null);

    const renderField = (field: BusinessField) => {
        const value = formData[field.key] ?? '';

        if (field.control === 'image') {
            return (
                <div className="space-y-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                        {value ? (
                            <img
                                src={value}
                                alt="Logo del comprobante"
                                className="h-20 w-auto max-w-[200px] rounded border bg-white object-contain p-2"
                            />
                        ) : (
                            <div className="flex h-20 w-[200px] items-center justify-center rounded border border-dashed text-xs text-muted-foreground">
                                Sin logo
                            </div>
                        )}
                        <div className="flex-1 space-y-2">
                            <Input
                                id={field.key}
                                value={value}
                                onChange={(e) => handleChange(field.key, e.target.value)}
                                placeholder="https://..."
                            />
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleLogoUpload(file);
                                    e.target.value = '';
                                }}
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={uploading}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Upload className="mr-2 h-4 w-4" />
                                {uploading ? 'Subiendo...' : 'Subir imagen'}
                            </Button>
                        </div>
                    </div>
                </div>
            );
        }

        if (field.control === 'textarea') {
            return (
                <Textarea
                    id={field.key}
                    rows={4}
                    value={value}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                />
            );
        }

        if (field.control === 'select') {
            return (
                <Select value={value || undefined} onValueChange={(v) => handleChange(field.key, v)}>
                    <SelectTrigger id={field.key}>
                        <SelectValue placeholder="Selecciona una opción" />
                    </SelectTrigger>
                    <SelectContent>
                        {(field.options ?? []).map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            );
        }

        return (
            <Input
                id={field.key}
                type={field.control === 'number' ? 'number' : field.control === 'email' ? 'email' : 'text'}
                min={field.control === 'number' ? 0 : undefined}
                value={value}
                placeholder={field.placeholder}
                onChange={(e) => handleChange(field.key, e.target.value)}
            />
        );
    };

    if (loading) {
        return <div className="p-8 text-center">Cargando...</div>;
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Negocio</h1>
                    <p className="text-muted-foreground mt-2">
                        Configuración general de la empresa usada por el ERP, el ecommerce y los comprobantes.
                    </p>
                </div>
                <Button type="submit" disabled={saving}>
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? 'Guardando...' : 'Guardar cambios'}
                </Button>
            </div>

            <Tabs defaultValue={BUSINESS_SECTIONS[0].id}>
                <TabsList>
                    {BUSINESS_SECTIONS.map((section) => (
                        <TabsTrigger key={section.id} value={section.id}>
                            {section.title}
                        </TabsTrigger>
                    ))}
                    <TabsTrigger value="advanced">Avanzado</TabsTrigger>
                </TabsList>

                {BUSINESS_SECTIONS.map((section) => (
                    <TabsContent key={section.id} value={section.id} className="mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>{section.title}</CardTitle>
                                <CardDescription>{section.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                {section.fields.map((field) => (
                                    <div
                                        key={field.key}
                                        className={`space-y-2 ${field.control === 'textarea' || field.control === 'image' ? 'md:col-span-2' : ''}`}
                                    >
                                        <Label htmlFor={field.key}>{field.label}</Label>
                                        {renderField(field)}
                                        {field.help && (
                                            <p className="text-xs text-muted-foreground">{field.help}</p>
                                        )}
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </TabsContent>
                ))}

                <TabsContent value="advanced" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Parámetros avanzados</CardTitle>
                            <CardDescription>
                                Todos los parámetros del sistema en formato nombre/valor. Modifícalos solo si sabes
                                cómo los usa el sistema.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-1/3">Nombre</TableHead>
                                        <TableHead>Valor</TableHead>
                                        <TableHead className="w-16" />
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {advancedRows.map((row, index) => (
                                        <TableRow key={row.id ?? `new-${index}`}>
                                            <TableCell>
                                                <Input
                                                    value={row.name}
                                                    disabled={!row.isNew}
                                                    placeholder="NombreDelParametro"
                                                    onChange={(e) => handleAdvancedChange(index, 'name', e.target.value)}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    value={row.value}
                                                    onChange={(e) => handleAdvancedChange(index, 'value', e.target.value)}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeAdvancedRow(index)}
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            <Button type="button" variant="outline" size="sm" onClick={addAdvancedRow}>
                                <Plus className="mr-2 h-4 w-4" />
                                Agregar parámetro
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </form>
    );
};

export default BusinessParametersPage;
