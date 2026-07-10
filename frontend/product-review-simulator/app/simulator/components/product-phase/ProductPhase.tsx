import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ArrowRight, Sparkles, Zap } from "lucide-react";
import { LoadingSpinner } from "@/components/loading-spinner";
import { Product, APIError } from "@/lib/types";
import { ProductService } from "@/lib/api-services";

interface ProductPhaseProps {
  product: Product;
  setProduct: (product: Product) => void;
  setActiveStep: (step: number) => void;
  isGeneratingBots: boolean;
  setIsGeneratingBots: (isGenerating: boolean) => void;
  setError: (error: APIError | null) => void;
}

export const ProductPhase: React.FC<ProductPhaseProps> = ({
  product,
  setProduct,
  setActiveStep,
  isGeneratingBots,
  setIsGeneratingBots,
  setError,
}) => {
  const [isSaving, setIsSaving] = useState(false);

  const handleContinue = async () => {
    setError(null);
    setIsSaving(true);
    try {
      await ProductService.updateProduct(product);
      setActiveStep(1);
    } catch (err) {
      console.error("Error al guardar los cambios del producto:", err);
      if ((err as APIError).status !== undefined) {
        setError(err as APIError);
      } else {
        setError({
          status: 500,
          message: `Error inesperado: ${(err as Error).message || 'Desconocido'}`,
          details: 'No se pudieron guardar los cambios del producto'
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      setIsGeneratingBots(true);
      
      // Obtener la URL del producto del formulario
      const productUrl = (e.currentTarget as HTMLFormElement).elements.namedItem('productUrl') as HTMLInputElement;
      
      // Ejecutar fase 1 para obtener información del producto
      const productInfo = await ProductService.analyzeProduct(productUrl.value);
      setProduct(productInfo);
      setActiveStep(1);
    } catch (err) {
      console.error("Error al analizar el producto:", err);
      if ((err as APIError).status !== undefined) {
        setError(err as APIError);
      } else {
        setError({
          status: 500,
          message: `Error inesperado: ${(err as Error).message || 'Desconocido'}`,
          details: 'Verifica la URL del producto e intenta nuevamente'
        });
      }
    } finally {
      setIsGeneratingBots(false);
    }
  }

  const isValidImageUrl = (url: string | undefined): boolean => {
    if (!url) return false;
    const cleanUrl = url.trim().toLowerCase();
    return (
      (cleanUrl.startsWith("http://") || cleanUrl.startsWith("https://") || cleanUrl.startsWith("/")) &&
      !cleanUrl.includes("unavailable") &&
      !cleanUrl.includes("not present") &&
      !cleanUrl.includes("scraped text") &&
      !cleanUrl.includes("placeholder.svg")
    );
  };
  return (
    <Card className="border-border bg-card/60 backdrop-blur-md overflow-hidden rounded-2xl shadow-lg shadow-black/[0.03]">
      <CardHeader className="border-b border-border/60 bg-muted/10 pb-5">
        <CardTitle className="flex items-center gap-2.5 text-lg font-bold">
          <Sparkles className="h-5 w-5 text-primary" />
          Información del producto
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground mt-1">Ingresa la URL de un producto o proporciona detalles para una nueva simulación</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleProductSubmit} className="space-y-6">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="productName" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Nombre del producto
                </Label>
                <Input
                  id="productName"
                  value={product.name}
                  onChange={(e) => setProduct({ ...product, name: e.target.value })}
                  className="bg-background/50 border-border focus-visible:ring-primary rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="productDescription" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Descripción del producto
                </Label>
                <Textarea
                  id="productDescription"
                  rows={4}
                  value={product.description}
                  onChange={(e) => setProduct({ ...product, description: e.target.value })}
                  className="bg-background/50 border-border focus-visible:ring-primary rounded-xl min-h-[120px] leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="productPrice" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Precio
                  </Label>
                  <Input
                    id="productPrice"
                    value={product.price}
                    onChange={(e) => setProduct({ ...product, price: e.target.value })}
                    className="bg-background/50 border-border focus-visible:ring-primary rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="productCategory" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Categoría
                  </Label>
                  <Input
                    id="productCategory"
                    value={product.category}
                    onChange={(e) => setProduct({ ...product, category: e.target.value })}
                    className="bg-background/50 border-border focus-visible:ring-primary rounded-xl"
                  />
                </div>
              </div>
            </div>

            {/* Columna derecha: Imagen del producto */}
            <div className="flex flex-col items-stretch justify-start p-5 bg-muted/20 rounded-2xl border border-border/80 backdrop-blur-sm">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Imagen del producto
              </Label>
              <div className="relative w-full h-[200px] bg-background/80 dark:bg-background/50 rounded-xl overflow-hidden border border-border flex items-center justify-center group shadow-sm">
                {isValidImageUrl(product.image) ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="max-w-full max-h-full object-contain p-3 transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = "/placeholder.svg?height=300&width=300";
                    }}
                  />
                ) : (
                  <div className="flex flex-col items-center text-center p-6 text-muted-foreground">
                    <Sparkles className="h-9 w-9 mb-2 stroke-[1.5] text-primary/60 animate-pulse" />
                    <span className="text-[11px] font-medium text-muted-foreground/80">Imagen no disponible</span>
                  </div>
                )}
              </div>
              <div className="w-full mt-4">
                <Label htmlFor="productImage" className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  URL de la imagen
                </Label>
                <Input
                  id="productImage"
                  value={product.image || ""}
                  onChange={(e) => setProduct({ ...product, image: e.target.value })}
                  placeholder="https://..."
                  className="bg-background/50 border-border focus-visible:ring-primary text-xs h-9 mt-1 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Características principales */}
          <div className="mt-6 bg-muted/25 dark:bg-muted/10 p-5 rounded-2xl border border-border/60">
            <h3 className="text-sm font-bold mb-4 text-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Características principales
            </h3>
            
            {product.main_features && product.main_features.length > 0 ? (
              <div className="space-y-3">
                {product.main_features.map((feature, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center border-b border-border/40 pb-3 last:border-0 last:pb-0">
                    <div className="font-semibold text-xs text-foreground/80">
                      {feature.feature}:
                    </div>
                    <div className="col-span-2 text-sm text-foreground">
                      <Input
                        value={feature.value || feature.description || ""}
                        onChange={(e) => {
                          const newFeatures = [...(product.main_features || [])];
                          newFeatures[index].value = e.target.value;
                          newFeatures[index].description = e.target.value;
                          setProduct({ ...product, main_features: newFeatures });
                        }}
                        className="bg-background/50 border-border focus-visible:ring-primary h-9 rounded-lg"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground italic">
                No hay características disponibles. Se añadirán al obtener información del producto.
              </div>
            )}

            <Button
              onClick={() => {
                const newFeatures = [...(product.main_features || [])];
                newFeatures.push({ feature: "Nueva característica", value: "" });
                setProduct({ ...product, main_features: newFeatures });
              }}
              variant="outline"
              size="sm"
              className="mt-4 border-border hover:bg-accent text-xs rounded-lg px-3.5 h-8 font-medium"
              type="button"
            >
              + Añadir característica
            </Button>
          </div>

          {/* Especificaciones técnicas */}
          <div className="mt-4 bg-muted/25 dark:bg-muted/10 p-5 rounded-2xl border border-border/60">
            <h3 className="text-sm font-bold mb-4 text-foreground flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              Especificaciones técnicas
            </h3>
            
            {product.technical_specs && product.technical_specs.length > 0 ? (
              <div className="space-y-3">
                {product.technical_specs.map((spec, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center border-b border-border/40 pb-3 last:border-0 last:pb-0">
                    <div className="font-semibold text-xs text-foreground/80">
                      {spec.spec}
                    </div>
                    <div className="col-span-2 text-sm text-foreground">
                      <Input
                        value={spec.value || spec.description || ""}
                        onChange={(e) => {
                          const newSpecs = [...(product.technical_specs || [])];
                          newSpecs[index].value = e.target.value;
                          newSpecs[index].description = e.target.value;
                          setProduct({ ...product, technical_specs: newSpecs });
                        }}
                        className="bg-background/50 border-border focus-visible:ring-primary h-9 rounded-lg"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground italic">
                No hay especificaciones técnicas disponibles. Se añadirán al obtener información del producto.
              </div>
            )}

            <Button
              onClick={() => {
                const newSpecs = [...(product.technical_specs || [])];
                newSpecs.push({ spec: "Nueva especificación", value: "" });
                setProduct({ ...product, technical_specs: newSpecs });
              }}
              variant="outline"
              size="sm"
              className="mt-4 border-border hover:bg-accent text-xs rounded-lg px-3.5 h-8 font-medium"
              type="button"
            >
              + Añadir especificación
            </Button>
          </div>
        </form>

        <div className="flex justify-end mt-8 border-t border-border/60 pt-5">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={handleContinue}
                disabled={isSaving}
                className="bg-primary text-primary-foreground hover:bg-primary/95 transition-all font-semibold rounded-xl px-5 h-10 shadow-sm shadow-primary/10"
                type="button"
              >
                {isSaving ? "Guardando cambios..." : "Continuar a configuración de bots"}
                {!isSaving && (
                  <motion.div
                    animate={{ x: [0, 3, 0] }}
                    transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.5 }}
                  >
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </motion.div>
                )}
              </Button>
            </motion.div>
          </div>
      </CardContent>
    </Card>
  );
}; 