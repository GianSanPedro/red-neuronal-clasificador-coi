# Dataset Final de COI animal

El catálogo de V9 tiene **148 grupos y 10.875 especies conocidas**. La incorporación de animales de BOLD suma 39 grupos y 3.010 especies conocidas al catálogo.

Cada especie conocida tiene al menos 20 ejemplares comprobados. Cada grupo nuevo tiene al menos cinco especies conocidas con reparto 14/3/3 y otras cinco especies completas reservadas para prueba, con al menos diez ejemplares por especie. Cuando la cobertura lo permite, también se reservan hasta cinco especies completas para validación.

| Archivo | Filas | Uso |
|---|---:|---|
| `entrenamiento.csv` | 1.030.599 | Entrenamiento de grupo y especie conocidos. |
| `validacion.csv` | 53.381 | Validación con otros ejemplares de especies conocidas. |
| `prueba_final.csv` | 54.129 | Prueba final reservada de especies conocidas. |

Las especies completas reservadas para medir la abstención están en **Dataset Especie Desconocida**. Los catálogos de la red están en `catalogos/`. En los CSV de evaluación, `ampliacion` indica el lote de incorporación de cada fila y `fuente` conserva su origen. Esto permite conservar las comparaciones históricas de validación.

Las filas con `tipo_evidencia=accesion` pueden contribuir al entrenamiento. El mínimo de 20 ejemplares y las reservas de especies completas requieren evidencia de ejemplar.

El [informe de incorporación](relevamiento.json) conserva el detalle de los recuentos y la historia de las fuentes previas. Las columnas `fuente` y `registros_fuente` conservan la procedencia y los identificadores originales de cada ejemplar. El paquete original de BOLD y su auditoría se encuentran en [Fuentes](<../Fuentes/BOLD Publico - 02-Oct-2026/>). Las accesiones apartadas al reservar especies nuevas se conservan en [el archivo de procedencia](<../Fuentes/BOLD - accesiones apartadas al reservar especies.csv>).

La [conciliación taxonómica](<../Fuentes/BOLD - conciliacion taxonomica.csv>) conserva el grupo anterior de los registros reasignados. Los nuevos ejemplares con etiquetas de grupo en conflicto están documentados en [registros apartados](<../Fuentes/BOLD - registros con asignacion taxonomica conflictiva.csv>).
