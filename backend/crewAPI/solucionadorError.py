from venv import logger


def deshabilitar_opentelemetry():
    try:
        # Intentamos importar el módulo para parchear su función export
        import opentelemetry.sdk.trace.export
        
        # Reemplazamos la función export con una que no hace nada
        def dummy_export(*args, **kwargs):
            return None
        
        # Aplicamos el parche
        opentelemetry.sdk.trace.export.BatchSpanProcessor._export_batch = dummy_export
        logger.info("✅ OpenTelemetry exportador deshabilitado correctamente")
    except ImportError:
        logger.info("OpenTelemetry no encontrado, no es necesario deshabilitar")
    except Exception as e:
        logger.warning(f"No se pudo deshabilitar completamente OpenTelemetry: {str(e)}")

def parchear_conexion_openai_compatible():
    try:
        import instructor
        from instructor import Mode
        
        # Guardamos el original
        original_from_provider = instructor.from_provider
        
        def custom_from_provider(*args, **kwargs):
            base_url = kwargs.get("base_url")
            if base_url and "ada01.ujaen.es" in base_url:
                kwargs["mode"] = Mode.MD_JSON
            return original_from_provider(*args, **kwargs)
            
        instructor.from_provider = custom_from_provider
        print("✅ Parcheado instructor.from_provider para usar Mode.MD_JSON con ada01.ujaen.es")
    except Exception as e:
        print(f"⚠️ Error al parchear instructor: {e}")

    try:
        from crewai.llms.providers.openai.completion import OpenAICompletion
        
        # Guardamos el original
        original_supports = OpenAICompletion.supports_function_calling
        
        def custom_supports_function_calling(self) -> bool:
            if getattr(self, "base_url", None) and "ada01.ujaen.es" in self.base_url:
                return False
            return original_supports(self)
            
        OpenAICompletion.supports_function_calling = custom_supports_function_calling
        print("✅ Parcheado OpenAICompletion.supports_function_calling para retornar False con ada01.ujaen.es")
    except Exception as e:
        print(f"⚠️ Error al parchear OpenAICompletion: {e}")

parchear_conexion_openai_compatible()