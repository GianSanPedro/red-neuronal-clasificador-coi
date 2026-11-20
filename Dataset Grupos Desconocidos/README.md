# Dataset Grupos Desconocidos

El archivo `entrenamiento.csv` contiene **154.624 secuencias de 2.675 grupos** fuera del catálogo. Incluye 33.230 ventanas nuevas de BOLD. V9 usa este conjunto para aprender la respuesta «grupo desconocido». Se conserva una fila por ventana COI de 540 bases.

El archivo `validacion.csv` conserva 1.001 registros de los diez grupos reservados previamente. Cuando un grupo se incorpora al catálogo, sus ejemplares se redistribuyen de acuerdo con el rol de la especie. La [tabla de procedencia por ventana](<../Fuentes/BOLD - ejemplares por ventana de grupo desconocido.parquet>) conserva los identificadores de los ejemplares BOLD que representan ventanas iguales.

La prueba final independiente para grupos desconocidos está pendiente.
