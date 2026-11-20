// Cada elemento es una diapositiva. B indica la cantidad de secuencias del lote.
const slides = [
  {
    "kind": "cover",
    "chapter": "portada",
    "title": "Arquitectura del clasificador COI",
    "intro": "Un fragmento de 540 bases pasa por dos ramas para elegir un grupo y decidir qué especie puede asignarse.",
    "notes": "La presentación usa la arquitectura y la corrida guardada de Clasificacion_COI_V14_AMD.ipynb. COI es el gen de la subunidad I de la citocromo c oxidasa."
  },
  {
    "kind": "architecture",
    "chapter": "datos",
    "title": "Mapa general de la arquitectura",
    "intro": "Al clasificar una secuencia, el grupo predicho habilita la evaluación de especie y filtra los candidatos finales.",
    "cases": ["Especie conocida", "Especie nueva", "Grupo externo"],
    "nodes": {
      "entrada": {
        "label": "Entrada",
        "shape": "4 × 540",
        "tone": "datos",
        "title": "Secuencia en one-hot",
        "detailShape": "4 canales × 540 posiciones",
        "details": [
          "La secuencia contiene 540 bases A, C, G o T.",
          "El one-hot representa cada base en uno de los cuatro canales.",
          "Las dos ramas utilizan este mismo one-hot."
        ]
      },
      "grupo": {
        "label": "Grupo",
        "shape": "149 puntajes",
        "tone": "grupo",
        "title": "Perfiles y rechazo de grupo",
        "detailShape": "10.875 perfiles → 149 puntajes",
        "details": [
          "Compara la secuencia con los perfiles usando pesos por posición.",
          "Conserva el mejor puntaje de cada uno de los 148 grupos.",
          "Una red densa 2 → 16 → 1 agrega el puntaje de «grupo desconocido»."
        ]
      },
      "cnn": {
        "label": "CNN",
        "shape": "192 × 67",
        "tone": "especie",
        "title": "Tres bloques convolucionales",
        "detailShape": "4 × 540 → 192 × 67",
        "details": [
          "La rama de especie procesa el one-hot original.",
          "Cada bloque aplica dos convoluciones con BatchNorm y ReLU, seguidas de MaxPool(2).",
          "Salidas: 64 × 270 → 128 × 135 → 192 × 67."
        ]
      },
      "gru": {
        "label": "GRU × 2",
        "shape": "67 × 192",
        "tone": "especie",
        "title": "Dos GRU y pooling global",
        "detailShape": "67 × 192 → 384 valores",
        "details": [
          "Dos GRU de 192 unidades recorren los 67 pasos.",
          "Sobre la segunda GRU se calculan el máximo y el promedio temporal.",
          "Se concatenan los dos vectores de 192 valores en uno de 384."
        ]
      },
      "salida": {
        "label": "Densas + filtro",
        "shape": "384 → 128 → 11.024",
        "tone": "decision",
        "title": "Densas y filtro por grupo",
        "detailShape": "384 → 128 → 11.024 categorías",
        "details": [
          "Las capas densas producen 11.024 puntajes de especie.",
          "El filtro deja las especies del grupo elegido y su opción «especie desconocida».",
          "Gana la categoría con mayor probabilidad de pertenencia entre las permitidas."
        ]
      },
      "rechazo": {
        "label": "Especie no evaluada",
        "shape": "Fin del recorrido",
        "tone": "grupo",
        "title": "Fin en la rama de grupo",
        "detailShape": "Categoría 148: grupo desconocido",
        "details": [
          "Si gana «grupo desconocido», la clasificación termina en esta rama.",
          "Se devuelve «grupo desconocido» y «especie no evaluada»."
        ]
      }
    },
    "notes": "Este mapa anticipa el recorrido al clasificar, con los mejores pesos de ambas ramas ya cargados. Los perfiles se construyen antes del entrenamiento. La CNN recibe el one-hot original; el índice de grupo elegido se usa al filtrar la salida de especie. Los selectores muestran tres caminos con ejemplos de validación guardados. Los caminos de grupo conocido y grupo desconocido terminan en una respuesta con grupo y especie. Seleccioná un bloque o avanzá por los bloques para mostrar sus dimensiones y su función.",
    "source": "bloques 3, 5 y 9, RamaGrupo, RedCOIV12 y clasificar_secuencia"
  },
  {
    "kind": "table",
    "chapter": "datos",
    "title": "Datos de entrada y particiones",
    "intro": "Las tres carpetas distinguen especies conocidas, especies nuevas de grupos del catálogo y grupos externos.",
    "blocks": [
      {
        "title": "Lectura de los CSV",
        "input": "Seis CSV de entrenamiento y validación. Cada fila trae id, secuencia, grupo real y especie real.",
        "process": [
          "Se comprueba la separación de las particiones y se asigna el caso según el conjunto de origen."
        ],
        "output": "Filas con su caso, listas para reunir y contar por partición."
      },
      {
        "title": "Secuencias por partición",
        "input": "Filas de las tres carpetas con el caso ya asignado.",
        "process": [
          "Se reúnen los datos y se cuentan las secuencias de cada caso."
        ],
        "output": "Las bases van al one-hot. Las fichas aportan etiquetas y pesos."
      }
    ],
    "table": [
      [
        "Caso",
        "Entrenamiento",
        "Validación"
      ],
      [
        "Especie conocida",
        "1.030.599",
        "53.381"
      ],
      [
        "Especie nueva",
        "316.404",
        "14.964"
      ],
      [
        "Grupo externo",
        "154.624",
        "1.001"
      ],
      [
        "Total",
        "1.501.627",
        "69.346"
      ]
    ],
    "caption": "El catálogo reúne 148 grupos y 10.875 especies conocidas. Se reservan 10 grupos externos completos para validación.",
    "notes": "Dataset Final aporta especies conocidas. Dataset Especie Desconocida aporta especies nuevas de grupos del catálogo. Dataset Grupos Desconocidos aporta grupos externos. De estos, 2.675 grupos se usan para entrenar y otros 10 se reservan para validar. El código verifica al menos 5 especies conocidas por grupo y 20 ejemplares disponibles por especie conocida en el catálogo. Las accesiones pueden participar como secuencias pero se excluyen del conteo de ejemplares para el control de especies desconocidas de entrenamiento. Los CSV de prueba final están reservados. Se comprueba la separación de entrenamiento y validación por ID y secuencia y la reserva de especies completas de los casos nuevos.",
    "source": "bloque 2, lectura, controles y tabla de composición"
  },
  {
    "kind": "onehot",
    "chapter": "datos",
    "title": "Codificación de la secuencia",
    "intro": "Cambiá las primeras tres bases del ejemplo para ver qué canal se activa en cada posición.",
    "blocks": [
      {
        "title": "Secuencia de COI",
        "input": "El fragmento de texto de una fila del CSV.",
        "process": [
          "Se comprueba que tenga 540 letras A, C, G o T."
        ],
        "output": "Las 540 bases de cada secuencia pasan al codificador one-hot."
      },
      {
        "title": "Matriz one-hot",
        "input": "Las 540 letras de la secuencia validada.",
        "process": [
          "Activa con un 1 el canal de la base de cada posición."
        ],
        "output": "Tensor [B, 4, 540] en float32 para las dos ramas."
      }
    ],
    "caption": "B es la cantidad de secuencias del lote. El ejemplo muestra tres posiciones del tensor final.",
    "notes": "Cada secuencia se representa con cuatro canales y 540 posiciones. Por ejemplo, si la segunda base es G, la celda en la fila G y la columna 2 vale 1. La primera convolución recibe los cuatro canales y recorre el eje de posiciones. La rama de grupo también recibe esta matriz y pondera cada posición.",
    "source": "bloque 2, codificar_bases y a_one_hot, y bloque 9, clasificar_secuencia"
  },
  {
    "kind": "table",
    "chapter": "datos",
    "title": "Etiquetas de grupo y especie",
    "intro": "Los vectores se llenan con los datos del CSV antes de armar los lotes.",
    "blocks": [
      {
        "title": "Del CSV a los vectores",
        "input": "Cada fila del CSV trae una secuencia y los nombres de su grupo y su especie.",
        "process": [
          "Se ordenan y numeran desde 0 los nombres distintos de grupo y de especie del entrenamiento de especies conocidas.",
          "El código busca el número que corresponde a cada secuencia y lo guarda en su posición."
        ],
        "output": "Obtenemos un vector de grupo y otro de especie. Si la secuencia i es de Acrida cinerea, grupo[i] = 1 (Acrididae) y especie[i] = 90."
      },
      {
        "title": "Longitud de los vectores",
        "input": "Las 1.501.627 secuencias del entrenamiento de grupo.",
        "process": [
          "Las 154.624 secuencias de grupos externos tienen especie anotada. Se usan solo en grupo, con etiqueta 148 («grupo desconocido»)."
        ],
        "output": "En el ejemplo, grupo guarda [1, 1, 148] y especie [90, 5626]."
      }
    ],
    "tableClass": "label-table",
    "table": [
      ["Fila i", "Secuencia de ejemplo", "Grupo[i]", "Especie[i]"],
      ["0", "Acrida cinerea", "1", "90"],
      ["1", "Locusta migratoria", "1", "5626"],
      ["2", "De grupo externo", "148", "Solo grupo"]
    ],
    "caption": "El vector de grupo tiene dimensión [1.501.627] y el de especie [1.347.003] (1.501.627 − 154.624).",
    "notes": "Antes de armar los lotes, indice_grupo e indice_especie vinculan los nombres ordenados con sus números. objetivos_grupo y objetivos_especie llenan los vectores en el orden de las secuencias de cada rama. TensorDataset guarda las secuencias y etiquetas alineadas. Los 148 grupos del catálogo se numeran de 0 a 147. Los grupos externos usan 148 en grupo. Esas secuencias también tienen especie anotada en el CSV. El código las excluye del entrenamiento de especie porque el peso de ese caso es cero en esa rama. Las especies conocidas se numeran de 0 a 10.874. Una especie nueva de un grupo conocido usa 10.875 + g, donde g es el número de su grupo.",
    "source": "bloque 2, índices, objetivos_grupo, objetivos_especie y TensorDataset"
  },
  {
    "kind": "table",
    "chapter": "datos",
    "title": "Cómo se calcula el error de una secuencia",
    "equalColumns": true,
    "intro": "La etiqueta de grupo de cada secuencia es el número guardado para ella en el vector de grupo. Para una secuencia de un grupo externo, ese número es 148 («grupo desconocido»).",
    "blocks": [
      {
        "title": "De los puntajes al error",
        "process": [
          {
            "bullets": [
              "Durante el entrenamiento, la red calcula 149 puntajes por secuencia, uno por categoría de grupo.",
              "Softmax convierte esos puntajes en probabilidades de pertenencia que suman 100 %.",
              "La entropía cruzada calcula el error con la probabilidad de pertenencia que la red le asignó al grupo *Target* de esa secuencia."
            ]
          },
          {
            "text": "Error = −ln(probabilidad del grupo esperado)",
            "formula": true
          }
        ]
      },
      {
        "title": "Una secuencia de Acrida cinerea",
        "process": [
          "Esta secuencia tiene etiqueta de grupo 1 (Acrididae). El cálculo usa la probabilidad que la red le asignó a Acrididae. Cuanto menor es esa probabilidad, mayor es el error."
        ]
      }
    ],
    "tableClass": "label-table",
    "table": [
      ["Probabilidad que la red da a Acrididae", "Error de esa secuencia"],
      ["80 %", "−ln(0,80) ≈ 0,22"],
      ["20 %", "−ln(0,20) ≈ 1,61"]
    ],
    "caption": "Esta cuenta es la entropía cruzada por secuencia. ln indica el logaritmo natural.",
    "notes": "Las probabilidades del ejemplo son ilustrativas. El notebook pasa a F.cross_entropy los puntajes crudos del lote y las etiquetas de grupo de sus secuencias. Con reduction='none', calcula un error por secuencia mediante el logaritmo negativo de la probabilidad de la categoría de grupo esperada. La rama de especie hace la misma cuenta con sus 11.024 categorías de especie y la etiqueta de especie de cada secuencia.",
    "source": "bloques 6 y 7, F.cross_entropy con reduction='none'"
  },
  {
    "kind": "parallel",
    "chapter": "datos",
    "title": "Por qué un grupo grande cuenta más",
    "intro": "En el promedio simple del lote, sumamos los errores de todos los grupos y dividimos por el total de secuencias. Cada una cuenta igual.",
    "introBullets": [
      "La red ajusta sus parámetros al final de cada lote para reducir la pérdida.",
      "Una época es una pasada por todos los lotes.",
      "La pérdida de la época promedia los errores de todas las secuencias de esa pasada."
    ],
    "blocks": [
      {
        "title": "El promedio de 105 secuencias",
        "process": [
          "Las secuencias son de especies conocidas.",
          {
            "bullets": [
              "Acrididae (70 secuencias)",
              "Aphididae (35 secuencias)"
            ]
          },
          "Supongamos un error de 5 por secuencia.",
          {
            "bullets": [
              "Acrididae aporta 70 × 5 = 350",
              "Aphididae aporta 35 × 5 = 175"
            ]
          },
          {
            "text": "Promedio = (350 + 175) ÷ 105 = 5",
            "formula": true
          }
        ]
      },
      {
        "title": "Si baja el error de Acrididae",
        "process": [
          "Supongamos que el error de Acrididae baja de 5 a 4 por secuencia.",
          {
            "bullets": [
              "Acrididae aporta 70 × 4 = 280",
              "Aphididae aporta 35 × 5 = 175"
            ]
          },
          "Dividimos por el total de secuencias del lote:",
          {
            "text": "Nuevo promedio = (280 + 175) ÷ 105 ≈ 4,33",
            "formula": true
          }
        ]
      }
    ],
    "summary": "Acrididae aporta al promedio el error de 70 secuencias y Aphididae, el de 35. Por eso una misma mejora por secuencia tiene más efecto en el promedio cuando ocurre en el grupo grande.",
    "notes": "Las 105 secuencias de especies conocidas son parte del ejemplo de 400 de la filmina siguiente. El optimizador ajusta los parámetros en cada lote. Para registrar la pérdida de la época, el notebook multiplica la pérdida de cada lote por su cantidad de secuencias, suma esos valores y divide por el total de secuencias procesadas.",
    "source": "bloques 6 y 7, agregación del error por lote"
  },
  {
    "kind": "table",
    "chapter": "datos",
    "title": "Cómo se reparten los pesos",
    "equalColumns": true,
    "intro": "En el promedio simple, los grupos con más secuencias influyen más en la pérdida. Para equilibrarlos, damos el mismo peso total a los grupos de cada caso. Fijamos los porcentajes como hiperparámetros según cuánta **importancia** le damos a cada caso.",
    "blocks": [
      {
        "title": "Del peso total a cada caso",
        "process": [
          "Si tuviésemos 400 secuencias de entrenamiento en la rama de grupo, calcularíamos los pesos antes de armar los lotes.",
          {
            "bullets": [
              { "label": "Especies conocidas (35 %)", "calculation": "400 × 0,35 = 140" },
              { "label": "Especies nuevas (25 %)", "calculation": "400 × 0,25 = 100" },
              { "label": "Grupos externos (40 %)", "calculation": "400 × 0,40 = 160" }
            ]
          },
          "Los valores calculados se reparten en partes iguales entre los grupos de su caso."
        ]
      },
      {
        "title": "Del caso a cada secuencia",
        "process": [
          "Supongamos que 105 de las 400 son de **especies conocidas**.",
          {
            "bullets": [
              "Con dos grupos, cada uno recibe 140 ÷ 2 = 70.",
              "Dividimos 70 por la cantidad de secuencias del grupo."
            ]
          }
        ]
      }
    ],
    "tableClass": "label-table",
    "table": [
      ["Grupo", "Secuencias", "Peso por secuencia", "Peso total"],
      ["Acrididae", "70", "70 ÷ 70 = 1", "70 × 1 = 70"],
      ["Aphididae", "35", "70 ÷ 35 = 2", "35 × 2 = 70"]
    ],
    "summary": [
      "El peso se calcula por secuencia antes de armar los lotes, según su caso y su grupo. Al entrenar, se suma el error de cada **secuencia** multiplicado por su **peso** y se divide una sola vez por la cantidad total de secuencias del lote."
    ],
    "notes": "La fórmula del notebook es w[i] = N × q[c] / (K[c] × n[c,u]). N es el total de secuencias de entrenamiento de la rama, q[c] la parte asignada al caso, K[c] la cantidad de grupos o especies distintos de ese caso y n[c,u] la cantidad de secuencias del grupo o especie de la secuencia i dentro de ese caso. Los grupos y especies que se cuentan son los anotados en los datos. La rama de especie reparte entre especies, con 75 % para conocidas, 25 % para nuevas de grupos del catálogo y 0 % para externas. Excluye las externas antes de calcular N. El cargador baraja las secuencias junto con sus etiquetas y pesos. Los lotes son de hasta 512 secuencias en grupo y hasta 2.048 en especie. En grupo también se guarda el índice del perfil propio. Durante el entrenamiento se multiplica cada error por su peso y se toma la media del lote.",
    "source": "bloques 1 y 2, PESOS_CASOS, ponderar_casos y DataLoader. Bloques 6 y 7, media de los errores multiplicados por sus pesos"
  },
  {
    "kind": "branch",
    "chapter": "datos",
    "title": "Bifurcación de la entrada",
    "intro": "Cada rama usa sus propios *Targets* y pesos para calcular la pérdida.",
    "blocks": [
      {
        "title": "Datasets",
        "input": "Un lote de B secuencias de 540 bases cada una.",
        "output": "Tensor one-hot [B, 4, 540]\nRango 3"
      },
      {
        "title": "1. Grupo",
        "input": "Tensor one-hot y banco de perfiles de referencia.",
        "process": [
          "Compara la secuencia con los perfiles y calcula el rechazo."
        ],
        "output": "149 puntajes por secuencia para la pérdida y la decisión de grupo.\nSoftmax convierte esos puntajes en probabilidades de pertenencia.",
        "chapter": "grupo"
      },
      {
        "title": "2. Especie",
        "input": "Tensor one-hot de la secuencia.",
        "process": [
          "La CNN–GRU extrae patrones y calcula puntajes por especie."
        ],
        "output": "11.024 puntajes para la pérdida de especie y el filtro final por grupo.\nSoftmax calcula probabilidades de pertenencia tras el filtro.",
        "chapter": "especie"
      }
    ],
    "caption": "En la rama de especie se analiza el grado de pertenencia de cada secuencia a las especies del **grupo** que obtuvo mayor probabilidad en la rama de grupo. Las secuencias que la rama de grupo marca como «grupo desconocido» quedan sin evaluar en especie.",
    "notes": "Los datasets guardan las bases como índices de 0 a 3 en el orden A, C, G y T, junto con las categorías esperadas y los pesos. El dataset de grupo también guarda el índice del perfil propio. El cargador forma lotes de tamaño y composición distintos para cada rama y a_one_hot convierte sus secuencias al tensor de la entrada. Ambas ramas tienen parámetros propios. En validación de especie y en inferencia, el grupo predicho se usa para decidir si se procesa esa secuencia con la CNN–GRU y qué categorías pueden ganar.",
    "source": "bloques 2, 3, 6 y 7"
  },
  {
    "kind": "flow",
    "chapter": "grupo",
    "title": "Un perfil de referencia por especie",
    "intro": "El perfil sirve como referencia para comparar una secuencia con cada especie conocida.",
    "blocks": [
      {
        "title": "Base más frecuente por posición",
        "chapter": "datos",
        "process": [
          {
            "table": [
              ["Posición", "1", "2", "3"],
              ["Secuencia 1", "A", "G", "T"],
              ["Secuencia 2", "A", "G", "C"],
              ["Secuencia 3", "C", "G", "T"],
              ["Perfil", "A", "G", "T"]
            ],
            "tableClass": "label-table profile-table",
            "caption": "Secuencias y perfil de una especie"
          },
          {
            "text": "P[s,j] = argmax sobre c de conteo(s,j,c)",
            "formula": true
          }
        ]
      },
      {
        "title": "Banco de perfiles",
        "alignLabels": true,
        "input": "Los perfiles de las 10.875 especies conocidas y el grupo al que pertenece cada especie.",
        "process": [
          "Codifica cada perfil en one-hot y junta sus 4 canales de 540 posiciones en un vector de 4 × 540 = 2.160 valores."
        ],
        "output": "El número de especie i es el índice común.\nLa fila i de la matriz [10.875, 2160] guarda su perfil.\nLa posición i del vector grupo_por_perfil guarda su número de grupo."
      }
    ],
    "notes": "Para la especie s y posición j, conteo(s,j,c) es la suma de 1 por cada secuencia de entrenamiento que tenga base c en j. La moda se calcula independientemente en cada posición. np.argmax toma el primer índice en un empate. Los perfiles codificados y su mapa de grupos son buffers, por lo que Adam solo ajusta los pesos posicionales y la red de rechazo. El checkpoint conserva una firma del banco para verificar que la reanudación utilice los mismos perfiles.",
    "source": "bloques 2 y 3, perfiles_bases, grupo_por_perfil y RamaGrupo.__init__"
  },
  {
    "kind": "flow",
    "chapter": "grupo",
    "title": "Parecido entre la muestra y cada perfil",
    "blocks": [
      {
        "title": "Contar las coincidencias",
        "chapter": "datos",
        "process": [
          "Cada letra igual suma **1**. Cada letra distinta suma **0**.",
          {
            "table": [
              ["Posición", "1", "2", "3", "Coincidencias"],
              ["Muestra ACT", "A", "C", "T", "—"],
              ["Perfil AGT", "A", "G", "T", "1 + 0 + 1 = 2"],
              ["Perfil ACC", "A", "C", "C", "1 + 1 + 0 = 2"]
            ],
            "caption": "Conteo de coincidencias entre ACT y los perfiles AGT y ACC"
          }
        ]
      },
      {
        "title": "Sumar el peso de cada coincidencia",
        "chapter": "datos",
        "process": [
          "Algunas posiciones ayudan más a distinguir grupos.",
          {
            "table": [
              ["Perfil", "1 (peso 2)", "2 (peso 1)", "3 (peso 3)", "Puntaje"],
              ["AGT", "2 × 1", "1 × 0", "3 × 1", "2 + 0 + 3 = 5"],
              ["ACC", "2 × 1", "1 × 1", "3 × 0", "2 + 1 + 0 = 3"]
            ],
            "caption": "Puntajes de parecido con ACT usando pesos de 2, 1 y 3 por posición"
          },
          "El producto escalar con el one-hot suma estos aportes."
        ]
      }
    ],
    "summary": [
      "**El puntaje resultante va de 0 a 540**",
      {
        "bullets": [
          "Los pesos se **aprenden durante el entrenamiento**, pueden ser **fraccionarios** y se comparten entre todas las muestras y perfiles.",
          "Los **540 pesos siempre suman 540**. Cuando unas posiciones ganan peso, otras lo pierden.",
          "Cada muestra obtiene **10.875 puntajes**, uno por perfil de especie conocida. Un lote de B muestras produce un **tensor [B, 10.875]**."
        ]
      }
    ],
    "notes": "El mismo vector de pesos se usa para todas las secuencias y perfiles. Los pesos 2, 1 y 3 del ejemplo son ilustrativos. La secuencia one-hot [B, 4, 540] se multiplica por los 540 pesos y se aplana a [B, 2160]. F.linear hace el producto escalar con cada fila del banco fijo [10.875, 2160]. La fórmula es C[b,p] = ∑ⱼ wpos[j] × I(x[b,j] = P[p,j]), donde I vale 1 si las bases coinciden y 0 si son distintas. wpos[j] pondera una posición al comparar bases. w[i], del reparto por casos, pondera el error de toda una secuencia.",
    "source": "bloque 3, RamaGrupo.pesos_por_posicion y primera parte de forward"
  },
  {
    "kind": "parallel",
    "chapter": "grupo",
    "title": "θ y el aprendizaje de los pesos",
    "intro": "Entrenar consiste en ajustar números para reducir la pérdida. Aquí se entrena directamente el vector θ.",
    "blocks": [
      {
        "title": "Qué es θ y cuándo se usa",
        "process": [
          {
            "bullets": [
              "Tras armar los perfiles, se crea **θ con 540 parámetros entrenables**, uno por posición, inicializados en **0**.",
              "Softmax transforma θ en valores positivos que suman 1."
            ]
          },
          {
            "text": "pesos por posición (vector) = 540 × Softmax(θ)",
            "formula": true
          },
          {
            "bullets": [
              "Como θ empieza en cero en todas las posiciones, Softmax asigna 1/540 a cada una. Al aplicar la fórmula, cada peso inicial vale 1.",
              "**Antes de cada comparación**, los pesos multiplican las posiciones del one-hot de la muestra.",
              "Todas las muestras y perfiles comparten el mismo vector θ."
            ]
          }
        ]
      },
      {
        "title": "Ajuste después de cada lote",
        "process": [
          {
            "bullets": [
              "Con los pesos actuales se comparan las muestras con los perfiles y se calculan los **puntajes de grupo**.",
              "Se calcula la entropía cruzada con los *Targets* de grupo. Cada error se multiplica por su **peso por secuencia** de la filmina 7 y se promedia.",
              "**backward()** calcula el gradiente, que indica cómo cambiar θ para reducir la pérdida del lote.",
              "Con ese gradiente, **Adam** (tasa de aprendizaje **0,001**) ajusta θ. El lote siguiente utiliza los nuevos pesos."
            ]
          }
        ]
      }
    ],
    "caption": "La capa densa que aparece después aprende el rechazo de «grupo desconocido» y se ajusta con esta misma pérdida.",
    "notes": "θ es el parámetro self.peso_posiciones de RamaGrupo, registrado mediante nn.Parameter(torch.zeros(LONGITUD)). En pesos_por_posicion se calcula softmax(dim=0) × LONGITUD, lo que hace positivos los pesos y conserva su suma en 540. El gradiente recorre la comparación, la máscara del perfil propio, el máximo por grupo, la escala, la salida de grupo desconocido y la entropía cruzada. La salida de rechazo también se entrena con la pérdida. ajustar_grupo calcula (errores × pesos_por_secuencia).mean() y añade 0,10 × mean((pesos_por_posicion − 1)²). zero_grad elimina los gradientes del lote anterior, backward calcula los del actual y Adam actualiza los parámetros una vez por lote. El entrenamiento de grupo usa lotes de hasta 512 secuencias y tasa de aprendizaje 0,001. El ajuste combina los aportes de todas las muestras del lote. Ejemplo ilustrativo: si ACT tiene como Target el grupo del perfil AGT y ACC representa otro grupo, subir el peso de la posición 3 respecto de la 2 favorece el puntaje del grupo Target. Al finalizar se carga el mejor modelo según validación y se congela la rama. La filmina siguiente desarrolla cómo los puntajes por perfil se convierten en puntajes de grupo.",
    "source": "bloques 1, 3, 5 y 7, HIPERPARAMETROS_GRUPO, RamaGrupo, entrenar_rama y ajustar_grupo"
  },
  {
    "kind": "flow",
    "chapter": "grupo",
    "title": "Del puntaje por perfil al puntaje por grupo",
    "intro": "Se decide qué perfiles pueden competir y luego se toma el mejor de cada grupo.",
    "blocks": [
      {
        "title": "Máscara del perfil propio",
        "alignLabels": true,
        "input": [
          "**Matriz [B, 10.875]**. B es la cantidad de muestras del lote. Cada fila contiene los puntajes de una muestra frente a los 10.875 perfiles.",
          "**Vector [B] con el índice del perfil propio**. Para cada muestra guarda la columna del perfil de su especie."
        ],
        "process": [
          "Se utiliza una máscara para ignorar, al buscar el máximo, el puntaje del perfil de la especie *Target* de la secuencia analizada.",
          "Al ignorarlo, el modelo aprende a reconocer su grupo **apoyándose en los perfiles de otras especies del mismo grupo**."
        ],
        "output": "Matriz [B, 10.875] con los puntajes que pasan al máximo por grupo."
      },
      {
        "title": "Máximo por grupo y escala",
        "alignLabels": true,
        "input": "Matriz [B, 10.875] con los puntajes por perfil que dejó la máscara.",
        "process": [
          "Se toma el máximo dentro de cada grupo y se divide por 540 × τ, con τ = 0,01.",
          {
            "text": "G[b,g] = máximo del grupo g / (540 × τ)",
            "formula": true
          },
          {
            "label": "Ejemplo",
            "text": "El mejor grupo queda en 496,8 / 5,4 = 92."
          }
        ],
        "output": "Matriz [B, 148] con un puntaje por muestra y grupo, de 0 a 100. Alimenta el cálculo del rechazo."
      }
    ],
    "notes": "El vector perfil_propio se prepara a partir de la especie registrada en el CSV mediante indice_especie. Tiene un valor por muestra y viaja con ella en el lote de grupo. Guarda la columna del perfil de esa especie si es conocida y −1 si carece de perfil. La máscara booleana tiene dimensión [B, 10.875] y marca una sola celda por muestra de especie conocida. masked_fill reemplaza esas celdas por −∞ para excluirlas de la búsqueda del máximo. El Target de grupo conserva el grupo correcto de la muestra. La comparación y la máscara se calculan dentro de RamaGrupo.forward antes del máximo por grupo y de la capa de rechazo. La reducción scatter_reduce con amax toma el máximo por grupo. En validación e inferencia se utilizan todos los perfiles.",
    "source": "bloques 1 y 3, TEMPERATURA_GRUPO y RamaGrupo.forward"
  },
  {
    "kind": "rejection",
    "chapter": "grupo",
    "title": "La salida de grupo desconocido",
    "intro": "Los dos puntajes más altos del catálogo indican qué tan fuerte es la mejor coincidencia y cuánto supera a la segunda.",
    "blocks": [
      {
        "title": "Dos señales para el rechazo",
        "alignLabels": true,
        "input": "Matriz [B, 148] con un puntaje por muestra y grupo. Es el máximo entre los perfiles del grupo.",
        "process": [
          {
            "text": "**r** = [m − 85, m − m₂]\n  = [92 − 85, 92 − 88] = [7, 4]",
            "formula": true
          },
          {
            "bullets": [
              "**m** es el mayor puntaje de grupo y **m₂** es el segundo mayor.",
              "**m − 85** mide la distancia al valor de referencia.",
              "**m − m₂** mide el margen."
            ]
          }
        ],
        "output": "B vectores **`r`**, uno por muestra, para la red de rechazo."
      },
      {
        "title": "Red densa de rechazo",
        "alignLabels": true,
        "input": "Las dos señales de **`r`** y el máximo del catálogo `m`.",
        "process": [
          "La primera densa tiene 16 neuronas con ReLU.",
          "La segunda, de una neurona, hace una combinación ponderada y devuelve el ajuste Δ.",
          {
            "text": "z[desconocido] = z[148] = m + Δ",
            "formula": true
          }
        ],
        "output": "Matriz [B, 149] con un vector `z` por muestra, formado por 148 puntajes de grupos conocidos y uno de «grupo desconocido»."
      }
    ],
    "caption": "«Grupo desconocido» gana cuando m + Δ supera a m.",
    "notes": "La red de rechazo calcula Δ = W₂ · ReLU(W₁ · r + b₁) + b₂. El valor 85 es un punto de referencia para centrar la primera señal. El ajuste depende de la mejor coincidencia y de su separación del segundo grupo. ReLU(v) = max(0, v). El vector de 149 puntajes pone la clase desconocida al final. Si el puntaje de desconocido empata con el máximo conocido, argmax conserva el índice conocido que aparece primero.",
    "source": "bloque 3, RamaGrupo.forward y configuración de rechazo"
  },
  {
    "kind": "flow",
    "chapter": "grupo",
    "title": "Entrenamiento de la rama de grupo",
    "intro": "La pérdida junta los puntajes que produjo la secuencia con su *Target* y su peso.",
    "blocks": [
      {
        "title": "Pérdida ponderada",
        "alignLabels": true,
        "input": "Puntajes z de grupo [B, 149], *Target* de grupo y[i] de la secuencia y peso w[i] del reparto.",
        "process": [
          "La entropía cruzada CE mide el error en la categoría esperada.",
          {
            "text": "CE[i] = −log(softmax(z[i])[y[i]])",
            "formula": true
          },
          {
            "text": "CE[i] = −log(probabilidad del grupo *Target*)",
            "formula": true
          },
          {
            "text": "R = (∑ⱼ (wpos[j] − 1)²) / 540",
            "formula": true
          },
          {
            "text": "L = (∑ᵢ w[i] * CE[i]) / B + 0,10 * R",
            "formula": true
          }
        ],
        "output": "Una pérdida escalar L"
      },
      {
        "title": "Actualización con Adam",
        "process": [
          {
            "bullets": [
              "**backward()** calcula los gradientes de **L** respecto de los parámetros.",
              "**Adam** usa esos gradientes para actualizar los **540 parámetros θ de posición** y los **pesos y sesgos de las densas de rechazo**. Tasa: **0,001**.",
              "El **siguiente lote** usa esos parámetros actualizados."
            ]
          },
          "Hasta **512 secuencias por lote**, durante **200 épocas**."
        ]
      }
    ],
    "caption": [
      "**wpos[j]** es el peso aprendido de la posición j. j recorre de 0 a 539.",
      "**R** penaliza que esos 540 pesos se alejen de 1 para moderar la concentración de importancia en pocas posiciones.",
      "La pérdida escalar **L** suma el promedio de los errores ponderados y **0,10** veces **R**."
    ],
    "notes": "CE es la entropía cruzada por secuencia. En la fórmula, z son los logits, y[i] es el índice del Target de grupo y k recorre los 149 candidatos. w[i] proviene de ponderar_casos y wpos[j] de softmax de los parámetros de posiciones, escalado por 540. El banco de perfiles queda fijo. El historial de pérdida de entrenamiento registra la parte de entropía cruzada ponderada sin el término de regularización. La semilla inicial es 42 y el ciclo fija SEMILLA + época.",
    "source": "bloques 1, 4 y 6, HIPERPARAMETROS_GRUPO, entrenar_rama y ajustar_grupo"
  },
  {
    "kind": "flow",
    "chapter": "grupo",
    "title": "Validación y congelamiento de grupo",
    "intro": "Al cerrar una época, se predice el grupo de las 69.346 secuencias de validación en lotes de hasta 2.048.",
    "blocks": [
      {
        "title": "Acierto por caso",
        "alignLabels": true,
        "input": "Los 149 puntajes por secuencia de validación y su *Target* de grupo.",
        "process": [
          "Se elige el índice de mayor puntaje. Cuenta como acierto cuando coincide con el *Target* de grupo."
        ],
        "output": {
          "text": "Tres porcentajes de acierto de grupo, uno para cada caso:",
          "bullets": [
            "Especies conocidas",
            "Especies nuevas de grupos conocidos",
            "Grupos externos"
          ],
          "after": "Se calcula el promedio de los tres porcentajes y se elige la época con el promedio más alto."
        }
      },
      {
        "title": "Selección de la mejor época",
        "alignLabels": true,
        "input": "El promedio de los tres porcentajes de acierto y la pérdida de validación de cada época.",
        "process": [
          "Se elige la época con el mayor promedio. Si hay empate, se elige la de menor pérdida de validación."
        ],
        "output": "La época elegida y sus parámetros de grupo, restaurados y congelados."
      }
    ],
    "caption": "En la corrida guardada se eligió la época 88. Grupo aceptó 66.824 de las 69.346 secuencias de validación.",
    "notes": "La tasa macro primero calcula la proporción de aciertos dentro de cada unidad del caso y después promedia esas proporciones con pesos iguales. La pérdida de validación de grupo promedia la entropía cruzada sin ponderación de las 69.346 filas. Se evalúa también la época 0. El mejor checkpoint pasa a modo eval y requires_grad_(False). Una fila aceptada es aquella para la que el argmax de grupo elige uno del catálogo, aunque ese grupo resulte incorrecto. Quedaron 2.522 filas rechazadas.",
    "source": "bloques 4 a 6, entrenar_rama, medir_grupos_validacion y salidas guardadas"
  },
  {
    "kind": "flow",
    "chapter": "especie",
    "title": "Convoluciones y pooling del bloque 1",
    "intro": "El primer bloque de especie busca patrones en las 540 posiciones de la secuencia.",
    "blocks": [
      {
        "title": "Dos convoluciones 1D",
        "alignLabels": true,
        "input": "El one-hot del codificador, con forma [B, 4, 540].",
        "process": [
          "Aplica dos Conv1d, cada una seguida de BatchNorm1d y ReLU.",
          {
            "label": "Conv 1",
            "text": "4 a 64 canales, filtro de 7 posiciones, padding\u00a03."
          },
          {
            "label": "Conv 2",
            "text": "64 a 64 canales, filtro de 5 posiciones, padding\u00a02."
          },
          "Ambas usan stride 1, dilatación 1 y carecen de sesgo."
        ],
        "output": "[B, 64, 540] de activaciones para el max pooling."
      },
      {
        "title": "Max pooling local",
        "alignLabels": true,
        "input": "Las activaciones [B, 64, 540] de las convoluciones.",
        "process": [
          "Por canal toma el mayor valor de cada par. Usa ventana 2, stride 2 y padding 0.",
          {
            "text": "Longitud de salida = ⌊540 / 2⌋ = 270",
            "formula": true
          },
          {
            "label": "Ejemplo",
            "text": {
              "text": "max(2, 5) = 5",
              "formula": true
            }
          }
        ],
        "output": "[B, 64, 270] que alimenta las convoluciones del bloque 2."
      }
    ],
    "caption": "Un filtro calcula y[o,t] = ∑(c,u) W[o,c,u] × x[c,t + u − p]. El padding conserva la longitud según L + 2p − k + 1 = L.",
    "notes": "La fórmula describe la correlación cruzada que aplica Conv1d, para un ejemplar. o indica el filtro de salida, c el canal de entrada, t la posición de salida y u el desplazamiento en el kernel. El padding p = ⌊k/2⌋ con kernel impar conserva la longitud L: L_salida = L + 2p − k + 1. Los pesos se comparten entre posiciones. MaxPool1d reduce la longitud y conserva los canales.",
    "source": "bloque 3, bloque_convolucional y RedCOIV12 (bloque CNN 1)"
  },
  {
    "kind": "flow",
    "chapter": "especie",
    "title": "Convoluciones y pooling del bloque 2",
    "intro": "El segundo bloque combina los mapas del pooling anterior para producir más canales.",
    "blocks": [
      {
        "title": "Dos convoluciones 1D",
        "alignLabels": true,
        "input": "Los mapas del max pooling del bloque 1, con forma [B, 64, 270].",
        "process": [
          "Aplica dos Conv1d, cada una seguida de BatchNorm1d y ReLU.",
          {
            "label": "Conv 1",
            "text": "64 a 128 canales, filtro de 5 posiciones, padding\u00a02."
          },
          {
            "label": "Conv 2",
            "text": "128 a 128 canales, filtro de 5 posiciones, padding\u00a02."
          },
          "Ambas usan stride 1, dilatación 1 y carecen de sesgo."
        ],
        "output": "[B, 128, 270] de activaciones para el max pooling."
      },
      {
        "title": "Max pooling local",
        "alignLabels": true,
        "input": "Las activaciones [B, 128, 270] de las convoluciones.",
        "process": [
          "Por canal toma el mayor valor de cada par. Usa ventana 2, stride 2 y padding 0.",
          {
            "text": "Longitud de salida = ⌊270 / 2⌋ = 135",
            "formula": true
          }
        ],
        "output": "[B, 128, 135] que alimenta las convoluciones del bloque 3."
      }
    ],
    "caption": "Por canal, BatchNorm(v) = γ(v − μ) / √(σ² + ε) + β. Después ReLU(v) = max(0, v).",
    "notes": "BatchNorm1d normaliza por canal. En entrenamiento estima μ y σ² usando ejemplos y posiciones del lote, y aprende γ y β. En evaluación utiliza estadísticas acumuladas. ReLU reemplaza los valores negativos por cero. Las dos convoluciones tienen stride 1, dilatación 1, padding de ceros de 2 y no usan sesgo.",
    "source": "bloque 3, bloque_convolucional y RedCOIV12 (bloque CNN 2)"
  },
  {
    "kind": "flow",
    "chapter": "especie",
    "title": "Convoluciones y pooling del bloque 3",
    "intro": "El último bloque convolucional deja 67 posiciones que se leerán como pasos de la GRU.",
    "blocks": [
      {
        "title": "Dos convoluciones 1D",
        "alignLabels": true,
        "input": "Los mapas del max pooling del bloque 2, con forma [B, 128, 135].",
        "process": [
          "Aplica dos Conv1d, cada una seguida de BatchNorm1d y ReLU.",
          {
            "label": "Conv 1",
            "text": "128 a 192 canales, filtro de 5 posiciones, padding\u00a02."
          },
          {
            "label": "Conv 2",
            "text": "192 a 192 canales, filtro de 3 posiciones, padding\u00a01."
          },
          "Ambas usan stride 1, dilatación 1 y carecen de sesgo."
        ],
        "output": "[B, 192, 135] de activaciones para el max pooling."
      },
      {
        "title": "Max pooling local",
        "alignLabels": true,
        "input": "Las activaciones [B, 192, 135] de las convoluciones.",
        "process": [
          "Por canal toma el mayor valor de cada par. Usa ventana 2, stride 2 y padding 0.",
          {
            "text": "Longitud de salida = ⌊135 / 2⌋ = 67",
            "formula": true
          }
        ],
        "output": "[B, 192, 67] que alimenta el cambio de ejes que prepara la primera GRU."
      }
    ],
    "caption": "Para un canal, y[t] = max(x[2t], x[2t + 1]). Con 135 posiciones quedan 67 pares completos y se descarta la última.",
    "notes": "MaxPool1d(2) usa stride 2 y floor en el cálculo de la longitud. Las posiciones de entrada 0 a 133 forman los 67 pares y la posición 134 queda fuera de la última ventana. El resultado de la CNN tiene 192 canales y 67 posiciones. La rama de grupo todavía no interviene en este cálculo.",
    "source": "bloque 3, bloque_convolucional y RedCOIV12 (bloque CNN 3)"
  },
  {
    "kind": "flow",
    "chapter": "especie",
    "title": "Transposición y primera GRU",
    "intro": "La CNN ordena canales antes de posiciones. Las GRU leen una secuencia de pasos, cada uno con sus características.",
    "blocks": [
      {
        "title": "Cambio de ejes",
        "alignLabels": true,
        "input": "Los mapas [B, 192, 67] del último max pooling.",
        "process": [
          "transpose(1, 2) pone las 67 posiciones antes de los 192 canales. contiguous() deja el tensor contiguo en memoria."
        ],
        "output": "[B, 67, 192] para que la primera GRU lea 192 valores por paso."
      },
      {
        "title": "Primera GRU",
        "alignLabels": true,
        "input": "Los 67 pasos de 192 valores que dejó el cambio de ejes.",
        "process": [
          "Una capa recorre los pasos en orden. Parte de un estado de 192 ceros y lo actualiza en cada paso."
        ],
        "output": "[B, 67, 192] con un estado por paso. La segunda GRU recibe los 67 estados."
      }
    ],
    "notes": "batch_first=True fija la forma [B, pasos, características]. No se pasa un h₀ explícito, así que la GRU empieza en cero. Las dos instancias son GRU separadas de una capa y una dirección. El código conserva la salida para cada paso y descarta el h_n devuelto como segundo elemento de la llamada.",
    "source": "bloque 3, RedCOIV12.__init__ y RedCOIV12.forward"
  },
  {
    "kind": "parallel",
    "chapter": "especie",
    "title": "Segunda GRU y actualización del estado",
    "intro": "Cada paso de la segunda GRU toma un estado de la primera y lo combina con su propia memoria del paso anterior.",
    "blocks": [
      {
        "title": "Segunda GRU",
        "alignLabels": true,
        "input": "[B, 67, 192] de la primera GRU.",
        "process": [
          "Una capa unidireccional con 192 unidades ocultas empieza en cero. Repite el cálculo de la derecha para los 67 pasos."
        ],
        "output": "[B, 67, 192] con todos los estados. Los usan el máximo y el promedio global."
      },
      {
        "title": "Cálculo en cada paso",
        "alignLabels": true,
        "input": "Entrada x del paso actual y estado previo h de esta GRU.",
        "process": [
          "Se calculan el reinicio r, la actualización z y el estado candidato n.",
          {
            "text": "r = σ(U_r(x) + V_r(h))",
            "formula": true
          },
          {
            "text": "z = σ(U_z(x) + V_z(h))",
            "formula": true
          },
          {
            "text": "n = tanh(U_n(x) + r ⊙ V_n(h))",
            "formula": true
          },
          {
            "text": "h′ = (1 − z) ⊙ n + z ⊙ h",
            "formula": true
          }
        ],
        "output": "El estado h′ se guarda en la secuencia de salida y sirve de memoria para el siguiente paso."
      }
    ],
    "caption": "U y V son transformaciones aprendidas. ⊙ multiplica elemento a elemento. Con z cerca de 1 se conserva más de h.",
    "notes": "Ecuaciones de la GRU usada en PyTorch. Para cada compuerta o candidato q, U_q(x) = W_iq x + b_iq y V_q(h) = W_hq h + b_hq. La compuerta r actúa después de la transformación afín de h en el término candidato. El cálculo se repite sobre los 67 pasos. El pooling posterior toma los estados de la segunda GRU.",
    "source": "bloque 3, gru_1 y gru_2 en RedCOIV12"
  },
  {
    "kind": "merge",
    "chapter": "especie",
    "title": "Pooling global de los estados",
    "intro": "El máximo resume las activaciones más fuertes y el promedio resume el nivel a lo largo de los pasos.",
    "blocks": [
      {
        "title": "Estados de GRU 2",
        "alignLabels": true,
        "input": "[B, 67, 192] de la segunda GRU.",
        "process": [
          "Se toman los 67 estados de cada secuencia."
        ],
        "output": "El mismo tensor H para ambos poolings."
      },
      {
        "title": "Máximo global",
        "alignLabels": true,
        "input": "Los 67 pasos de H.",
        "process": [
          "Por componente c toma el mayor valor.",
          {
            "text": "M[b,c] = máximo sobre t de H[b,t,c]",
            "formula": true
          }
        ],
        "output": "[B, 192] de máximos para concatenar."
      },
      {
        "title": "Promedio global",
        "alignLabels": true,
        "input": "Los mismos 67 pasos de H.",
        "process": [
          "Por componente c toma la media.",
          {
            "text": "P[b,c] = (1/67) × ∑ₜ H[b,t,c]",
            "formula": true
          }
        ],
        "output": "[B, 192] de promedios para concatenar."
      },
      {
        "title": "Concatenación",
        "alignLabels": true,
        "input": "Máximos y promedios de cada secuencia.",
        "process": [
          "Pone los 192 máximos seguidos de los 192 promedios."
        ],
        "output": "Resumen [B, 384] para la capa densa."
      }
    ],
    "notes": "amax(dim=1) y mean(dim=1) reducen el eje de pasos. El índice t recorre los 67 pasos producidos por GRU 2, y c recorre las 192 componentes de cada estado. Ambos resúmenes se calculan en paralelo a partir del mismo tensor. torch.cat(..., dim=1) arma primero las 192 posiciones de máximos y después las 192 de promedios.",
    "source": "bloque 3, amax, mean y torch.cat en RedCOIV12.forward"
  },
  {
    "kind": "flow",
    "chapter": "especie",
    "title": "Capa densa y logits de especie",
    "intro": "Las capas densas convierten el resumen de cada secuencia en un puntaje por categoría.",
    "blocks": [
      {
        "title": "Densa con ReLU y dropout",
        "alignLabels": true,
        "input": "El resumen [B, 384] del pooling global.",
        "process": [
          "Linear(384,128) con sesgo, seguido de ReLU.",
          "En entrenamiento, dropout anula activaciones con probabilidad 0,10 y divide las restantes por 0,90."
        ],
        "output": "[B, 128] de características que lee la proyección de salida."
      },
      {
        "title": "Proyección a categorías",
        "alignLabels": true,
        "input": "Las 128 características por secuencia de la capa densa.",
        "process": [
          "Linear(128,11024) con sesgo calcula z = W·h + b.",
          "Hay 10.875 especies conocidas, 148 categorías de especie desconocida y una de grupo desconocido."
        ],
        "output": "[B, 11.024] logits en float32. Van a la pérdida en entrenamiento o al filtro por grupo al predecir."
      }
    ],
    "notes": "Dropout utiliza una máscara aleatoria en cada llamada de entrenamiento. Con p=0,10, escala los valores retenidos por 1/(1−p). En eval actúa como identidad. Cada logit es un puntaje de la transformación afín de salida. En el entrenamiento se usa la entropía cruzada con logits, que realiza su propia normalización. La función de clasificación aplica softmax al vector de candidatos después del filtro.",
    "source": "bloques 1 a 3, DROPOUT, nombres_categorias, densa y salida"
  },
  {
    "kind": "flow",
    "chapter": "especie",
    "title": "Entrenamiento de la rama de especie",
    "intro": "La CNN–GRU procesa el one-hot de 1.347.003 secuencias de grupos del catálogo. Cada ficha aporta su etiqueta real.",
    "blocks": [
      {
        "title": "Entropía cruzada ponderada",
        "alignLabels": true,
        "input": "Logits [B, 11.024] de la CNN–GRU, etiqueta de especie y peso del reparto.",
        "process": [
          "Se calcula CE con los 11.024 puntajes y la categoría esperada. Se multiplica por el peso de la secuencia.",
          {
            "text": "L = mediaᵢ(w[i] × CE(z[i], y[i]))",
            "formula": true
          },
          "El reparto asigna 75 % a conocidas y 25 % a nuevas."
        ],
        "output": "Pérdida escalar que se retropropaga para producir los gradientes de la CNN–GRU."
      },
      {
        "title": "Actualización con Adam",
        "alignLabels": true,
        "input": "Los gradientes de la pérdida de especie.",
        "process": [
          "Actualiza la CNN, las dos GRU y las capas densas. Tasa 0,0001 y weight decay 0,0001.",
          "Hasta 2.048 secuencias por lote, durante 350 épocas."
        ],
        "output": "Pesos para el siguiente lote. Al terminar la época se evalúan con las decisiones del grupo congelado."
      }
    ],
    "caption": "Al entrenar, una especie nueva usa la etiqueta «especie desconocida» de su grupo real. Al validar, el grupo predicho decide qué candidatos compiten.",
    "notes": "La arquitectura de la CNN–GRU es RedCOIV12 y los pesos se entrenan desde la inicialización de la corrida V14. Se conservan todos los logits en el denominador de la entropía cruzada, incluida la categoría de grupo desconocido. Los ejemplos de grupo externo tienen peso cero en esta rama y se excluyen antes de preparar los lotes. Los parámetros de grupo ya están congelados y quedan fuera de este optimizador.",
    "source": "bloques 1, 2, 4 y 7, HIPERPARAMETROS_ESPECIE, objetivos_especie y ajustar_especie"
  },
  {
    "kind": "flow",
    "chapter": "especie",
    "title": "Validación y selección de pesos de especie",
    "intro": "La validación de cada época reutiliza el grupo predicho con los pesos congelados.",
    "blocks": [
      {
        "title": "Validación con grupo fijo",
        "alignLabels": true,
        "input": "Las 66.824 filas que grupo aceptó, sus bases y sus grupos predichos.",
        "process": [
          "La CNN–GRU puntúa esas secuencias. La pérdida de validación usa todos sus logits.",
          "Se aplica el filtro por grupo predicho para elegir especie. Las rechazadas quedan como «especie no evaluada»."
        ],
        "output": "Grupo y especie predichos para comparar con las fichas de validación."
      },
      {
        "title": "Mejor época de especie",
        "alignLabels": true,
        "input": "Las respuestas predichas y la ficha real de cada secuencia de validación.",
        "process": [
          "Conocida exige acertar grupo y nombre. Nueva exige acertar grupo y responder «especie desconocida».",
          "Grupo externo acierta con «grupo desconocido». El promedio de las tres tasas macro decide la mejor época. En empate gana la menor pérdida."
        ],
        "output": "Mejores pesos para clasificar. En la corrida guardada se eligió la época 283."
      }
    ],
    "caption": "El acierto para grupos externos se mantiene fijo porque procede de la rama de grupo congelada.",
    "notes": "La pérdida de validación de especie es la media de CE sin ponderación sobre las filas aceptadas y se calcula antes de enmascarar categorías. En la tasa macro de conocidas o especies nuevas, se promedia primero por especie real. En la de grupos externos se promedia por grupo real. Las métricas del lado derecho son sobre el conjunto de validación de cada caso completo, de modo que las conocidas y nuevas que fueron rechazadas cuentan como error en la identificación de especie. La respuesta de grupo externo depende del grupo congelado y permanece fija. Al terminar se restauran los mejores pesos de especie y se pasa a eval.",
    "source": "bloques 4, 5, 7 y 8, predecir_validacion, medir_respuestas y entrenar_rama"
  },
  {
    "kind": "decision-filter",
    "chapter": "decision",
    "title": "Cómo el grupo elegido filtra las especies",
    "intro": "Con las dos ramas ya entrenadas, seguimos una secuencia para la que la rama de grupo eligió **Acrididae**.",
    "example": {
      "group": "Acrididae",
      "scope": "Catálogo reducido a 4 categorías, con puntajes ilustrativos.",
      "candidates": [
        { "name": "Acrida cinerea", "group": "Acrididae", "score": 4, "latin": true },
        { "name": "Locusta migratoria", "group": "Acrididae", "score": 3, "latin": true },
        { "name": "Especie desconocida", "group": "Acrididae", "score": 2, "latin": false },
        { "name": "Especie de otro grupo", "group": "Otro grupo", "score": 6, "latin": false }
      ]
    },
    "caption": "Si gana «grupo desconocido», se devuelve «especie no evaluada» y `puntajes_especie = None`.",
    "notes": "El ejemplo es didáctico: reduce el catálogo a cuatro categorías para mostrar el filtro y poder continuar con una cuenta completa de Softmax en la siguiente filmina. Los puntajes 4, 3, 2 y 6 son ilustrativos; no son resultados medidos de V14. Acrida cinerea y Locusta migratoria figuran como especies conocidas de Acrididae en Dataset Final/catalogos/especies.csv. En el código real se conserva un vector de 11.024 puntajes y participan todas las especies conocidas del grupo elegido, además de su categoría desconocida. filtrar_especies compara grupo_por_categoria con el grupo predicho y reemplaza el resto por menos infinito. La especie de otro grupo no puede ganar aunque su puntaje original sea mayor. El grupo usado es una predicción de la primera rama.",
    "source": "bloques 2, 3 y 9, grupo_por_categoria, filtrar_especies y clasificar_secuencia"
  },
  {
    "kind": "decision-answer",
    "chapter": "decision",
    "title": "De los puntajes filtrados a la respuesta",
    "intro": "Continuamos con el catálogo reducido de la filmina anterior y su vector filtrado: `[4, 3, 2, −∞]`.",
    "caption": "Si gana «especie desconocida», se conserva el grupo elegido y se devuelve esa respuesta como especie.",
    "notes": "La entrada de este ejemplo es exactamente la salida del filtro de la filmina anterior. elegir_especies toma argmax sobre los puntajes filtrados: gana Acrida cinerea con puntaje 4. clasificar_secuencia recupera el nombre y, después, calcula Softmax únicamente sobre las categorías permitidas para construir puntajes_especie. Con los puntajes ilustrativos [4, 3, 2] se obtiene aproximadamente [66,5 %, 24,5 %, 9,0 %]. Son probabilidades del ejemplo reducido, no mediciones de V14. Los campos puntajes_grupo y puntajes_especie son pandas.Series indexadas por los nombres de las categorías. puntajes_grupo siempre contiene 149 probabilidades. Si se rechaza el grupo, especie vale «especie no evaluada» y puntajes_especie vale None. Si se acepta, esa serie incluye todas las especies de ese grupo y su opción desconocida.",
    "source": "bloques 3 y 9, elegir_especies y clasificar_secuencia"
  },
  {
    "kind": "results",
    "chapter": "decision",
    "title": "¿Qué tan bien decide la red?",
    "intro": "Las tasas por caso muestran cuánto acierta la rama de grupo y qué pasa al exigir la respuesta completa.",
    "rates": [
      {
        "title": "Especie conocida",
        "group": 0.9956794734059788,
        "response": 0.8820343132205003,
        "label": "Grupo y especie correctos"
      },
      {
        "title": "Especie nueva",
        "group": 0.8785465145724092,
        "response": 0.6848329675229943,
        "label": "Grupo correcto y rechazo de especie"
      },
      {
        "title": "Grupo nuevo",
        "group": null,
        "response": 0.7717543147119449,
        "label": "Rechazo de grupo"
      }
    ],
    "metrics": [
      {
        "value": 0.7795405318184798,
        "label": "Promedio de las tres respuestas completas"
      },
      {
        "value": 0.9113921643210346,
        "label": "Precisión al dar un nombre en grupos del catálogo"
      }
    ],
    "caption": "**Promedio por clase** Por especie en los dos primeros casos y por grupo en el tercero.",
    "notes": "Resultados de validación sobre 69.346 secuencias de la corrida V14_AMD. Se calcula el promedio por especie en los dos primeros casos y por grupo en el tercero. El 77,95 % promedia las tres respuestas completas con el mismo peso. El 91,14 % de precisión se calcula entre las respuestas que dieron un nombre para secuencias de grupos del catálogo. Formato tomado de la filmina de resultados de Presentación COI V14 AMD interactiva.html.",
    "source": "Notebook, bloque 8. Resultados/V14_AMD/metricas_validacion.csv"
  },
  {
    "kind": "decision-matrix",
    "chapter": "decision",
    "title": "¿Cuándo asigna un nombre o se abstiene?",
    "intro": "La matriz cruza el caso real con el tipo de respuesta, en secuencias y porcentajes de cada fila.",
    "columns": ["Dio un nombre", "Especie desconocida", "Grupo desconocido"],
    "rows": [
      { "label": "Especie conocida", "counts": [49459, 3772, 150] },
      { "label": "Especie nueva", "counts": [3121, 10251, 1592] },
      { "label": "Grupo nuevo", "counts": [118, 103, 780] }
    ],
    "caption": "**Para leer la matriz** «Dio un nombre» cuenta cualquier nombre devuelto, aunque sea incorrecto.",
    "notes": "Una respuesta con nombre puede asignar una especie incorrecta. Para evaluar la identidad, usá las métricas de la filmina anterior. Esta matriz muestra el tipo de respuesta para las 69.346 secuencias de validación. Cada porcentaje se calcula sobre el total de su fila. Los nueve conteos se tomaron de Resultados/V14_AMD/matriz_decisiones.csv y coinciden con la última filmina de Presentación COI V14 AMD interactiva.html. El conjunto de prueba final quedó reservado.",
    "source": "bloque 8, Resultados/V14_AMD/matriz_decisiones.csv"
  }
];
