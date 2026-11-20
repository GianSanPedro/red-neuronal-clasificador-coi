# Red neuronal: Clasificador COI

Trabajo final de Inteligencia Artificial: clasificación de secuencias COI de 540 bases mediante una rama de grupo y una rama de especie. Incluye el notebook de la versión V14 para GPU AMD, los datasets, sus resultados y la presentación interactiva.

## Contenido

| Ruta | Contenido |
|---|---|
| `Clasificacion_COI_V14_AMD.ipynb` | Preparación de datos, entrenamiento, validación y clasificación. |
| `Dataset Final/` | Secuencias de especies conocidas y catálogos de grupos y especies. |
| `Dataset Especie Desconocida/` | Secuencias de especies nuevas de grupos conocidos. |
| `Dataset Grupos Desconocidos/` | Secuencias de grupos externos al catálogo. |
| `Resultados/V14_AMD/` | Modelo guardado, métricas, historiales, predicciones y gráficos de V14. |
| `Presentación Clasificador COI/` | Presentación web local sobre la arquitectura y los resultados. |

Se conservan los archivos y nombres originales de los datasets. El notebook lee los archivos `entrenamiento.csv` de las tres carpetas. Los README de cada dataset describen su composición y procedencia; las referencias a una carpeta `Fuentes` corresponden al archivo de trabajo original y esa carpeta no forma parte de este repositorio.

Las iteraciones anteriores, los resultados de otras versiones y los respaldos de diseño de la presentación quedan fuera del repositorio.

## Descargar los archivos completos

Los CSV de datos y el archivo `checkpoint.pt` se almacenan con **Git LFS**. Instalá Git y Git LFS antes de clonar:

```powershell
git lfs install
git clone https://github.com/GianSanPedro/red-neuronal-clasificador-coi.git
cd red-neuronal-clasificador-coi
git lfs pull
```

## Abrir la presentación

Con Node.js instalado y disponible en `PATH`, ejecutá `Abrir Presentación Clasificador COI.cmd` dentro de la carpeta de la presentación. También podés iniciarla desde una terminal:

```powershell
cd "Presentación Clasificador COI"
node server.mjs --abrir
```

Se abre en `http://localhost:8766/`. El servidor utiliza módulos incluidos en Node.js y no requiere instalar paquetes de npm.

## Usar el notebook

Abrí `Clasificacion_COI_V14_AMD.ipynb` con Jupyter o VS Code y ejecutalo desde la raíz del repositorio, para conservar las rutas relativas de los datasets y resultados.

Esta variante comprueba que PyTorch tenga soporte ROCm y detecte una GPU AMD. En Windows también requiere las cabeceras del paquete ROCm SDK Core (`_rocm_sdk_core`). El entorno de Python utiliza NumPy, pandas, Matplotlib, IPython y PyTorch. El notebook contiene la configuración específica de HIPRTC y MIOpen.

## Resultados de validación de V14

Valores guardados en [`Resultados/V14_AMD/metricas_validacion.csv`](Resultados/V14_AMD/metricas_validacion.csv):

| Métrica | Resultado |
|---|---:|
| Grupo correcto en especies conocidas | 99,57 % |
| Especie correcta en especies conocidas | 88,20 % |
| Grupo correcto en especies nuevas | 87,85 % |
| Grupo correcto y respuesta «especie desconocida» | 68,48 % |
| Respuesta «grupo desconocido» en grupos nuevos | 77,18 % |
| Precisión al devolver un nombre de especie | 91,14 % |
| Promedio de validación registrado | 77,95 % |

Las épocas seleccionadas son 88 para grupo y 283 para especie. Los resultados publicados corresponden a la corrida guardada V14; clonar el repositorio no vuelve a ejecutar el entrenamiento.
