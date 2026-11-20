# Dataset Especie Desconocida

El archivo `entrenamiento.csv` contiene **316.404 registros de 65.471 especies** de grupos conocidos. Incluye 73.297 ejemplares nuevos de BOLD. Cada especie tiene menos de 20 ejemplares verificados. El total incluye registros identificados solo por accesión.

V9 usa este conjunto para aprender la respuesta «especie desconocida». El catálogo `catalogos/especies.csv` detalla los ejemplares, el número de ejemplares verificados y las fuentes. Las filas que cambian de rol conservan la procedencia. El [informe de incorporación](<../Dataset Final/relevamiento.json>) registra los traslados.

`validacion.csv` contiene **14.964** secuencias y `prueba_final.csv` contiene **14.948**. Cada etapa usa especies completas reservadas de grupos conocidos. `fuente` indica la procedencia de la fila y `ampliacion` registra su lote de incorporación.
