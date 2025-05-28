import React from "react";
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

  return (
    <Card className="border-purple-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          Información del producto
        </CardTitle>
        <CardDescription>Ingresa la URL de un producto o proporciona detalles para una nueva simulación</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleProductSubmit} className="space-y-4">
          

          <div className="space-y-2">
            <Label htmlFor="productName" className="text-sm font-medium">
              Nombre del producto
            </Label>
            <Input
              id="productName"
              value={product.name}
              onChange={(e) => setProduct({ ...product, name: e.target.value })}
              className="bg-white/70 dark:bg-gray-800/70 border-purple-200 dark:border-gray-700 focus-visible:ring-purple-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="productDescription" className="text-sm font-medium">
              Descripción del producto
            </Label>
            <Textarea
              id="productDescription"
              rows={3}
              value={product.description}
              onChange={(e) => setProduct({ ...product, description: e.target.value })}
              className="bg-white/70 dark:bg-gray-800/70 border-purple-200 dark:border-gray-700 focus-visible:ring-purple-500 min-h-[100px]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="productPrice" className="text-sm font-medium">
                Precio
              </Label>
              <Input
                id="productPrice"
                value={product.price}
                onChange={(e) => setProduct({ ...product, price: e.target.value })}
                className="bg-white/70 dark:bg-gray-800/70 border-purple-200 dark:border-gray-700 focus-visible:ring-purple-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="productCategory" className="text-sm font-medium">
                Categoría
              </Label>
              <Input
                id="productCategory"
                value={product.category}
                onChange={(e) => setProduct({ ...product, category: e.target.value })}
                className="bg-white/70 dark:bg-gray-800/70 border-purple-200 dark:border-gray-700 focus-visible:ring-purple-500"
              />
            </div>
          </div>

          {/* Características principales */}
          <div className="mt-6 bg-blue-50/50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3 text-blue-700 dark:text-blue-400 flex items-center">
              <Sparkles className="h-4 w-4 mr-2" />
              Características principales
            </h3>
            
            {product.main_features && product.main_features.length > 0 ? (
              <div className="space-y-2">
                {product.main_features.map((feature, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center border-b border-blue-100 dark:border-blue-800 pb-2 last:border-0">
                    <div className="font-medium text-sm text-blue-800 dark:text-blue-300">
                      {feature.feature}:
                    </div>
                    <div className="col-span-2 text-sm text-gray-700 dark:text-gray-300">
                      <Input
                        value={feature.value || feature.description || ""}
                        onChange={(e) => {
                          const newFeatures = [...(product.main_features || [])];
                          // Asignar a ambas propiedades para asegurar compatibilidad
                          newFeatures[index].value = e.target.value;
                          newFeatures[index].description = e.target.value;
                          setProduct({ ...product, main_features: newFeatures });
                        }}
                        className="bg-white/70 dark:bg-gray-800/70 border-blue-200 dark:border-blue-900 focus-visible:ring-blue-500 h-8"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500 dark:text-gray-400 italic">
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
              className="mt-3 border-blue-200 dark:border-blue-900 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-xs"
            >
              + Añadir característica
            </Button>
          </div>

          {/* Especificaciones técnicas */}
          <div className="mt-4 bg-purple-50/50 dark:bg-purple-900/20 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3 text-purple-700 dark:text-purple-400 flex items-center">
              <Zap className="h-4 w-4 mr-2" />
              Especificaciones técnicas
            </h3>
            
            {product.technical_specs && product.technical_specs.length > 0 ? (
              <div className="space-y-2">
                {product.technical_specs.map((spec, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center border-b border-purple-100 dark:border-purple-800 pb-2 last:border-0">
                    <div className="font-medium text-sm text-purple-800 dark:text-purple-300">
                      {spec.spec}
                    </div>
                    <div className="col-span-2 text-sm text-gray-700 dark:text-gray-300">
                      <Input
                        value={spec.value || spec.description || ""}
                        onChange={(e) => {
                          const newSpecs = [...(product.technical_specs || [])];
                          // Asignar a ambas propiedades para asegurar compatibilidad
                          newSpecs[index].value = e.target.value;
                          newSpecs[index].description = e.target.value;
                          setProduct({ ...product, technical_specs: newSpecs });
                        }}
                        className="bg-white/70 dark:bg-gray-800/70 border-purple-200 dark:border-purple-900 focus-visible:ring-purple-500 h-8"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500 dark:text-gray-400 italic">
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
              className="mt-3 border-purple-200 dark:border-purple-900 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-xs"
            >
              + Añadir especificación
            </Button>
          </div>

          <div className="flex justify-between mt-6">
            <Button
              onClick={async () => {
                try {
                  setError(null);
                  await ProductService.updateProduct(product);
                  // Mostrar un mensaje de éxito temporal
                  setError({
                    status: 200,
                    message: "Información del producto actualizada correctamente",
                    details: "Los cambios han sido guardados"
                  });
                  setTimeout(() => setError(null), 3000);
                } catch (err) {
                  console.error("Error al actualizar el producto:", err);
                  if ((err as APIError).status !== undefined) {
                    setError(err as APIError);
                  } else {
                    setError({
                      status: 500,
                      message: `Error: ${(err as Error).message || 'Desconocido'}`,
                      details: 'No se pudo actualizar la información del producto'
                    });
                  }
                }
              }}
              variant="outline"
              className="border-purple-200 dark:border-gray-700 hover:bg-purple-50 dark:hover:bg-gray-800 transition-colors"
              type="button"
            >
              Guardar cambios
            </Button>
            
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={() => setActiveStep(1)}
                className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white hover:opacity-90 transition-opacity"
                type="button"
              >
                Continuar a configuración de bots
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.5 }}
                >
                  <ArrowRight className="ml-2 h-4 w-4" />
                </motion.div>
              </Button>
            </motion.div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}; 