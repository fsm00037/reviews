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