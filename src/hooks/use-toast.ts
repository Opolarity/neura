// Re-export del store canónico, que vive en shared/. Se mantiene este path
// porque hay imports desde `@/hooks/use-toast` repartidos por la app.
export { useToast, toast, reducer } from "@/shared/hooks/use-toast";
