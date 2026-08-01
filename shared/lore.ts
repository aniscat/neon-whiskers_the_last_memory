/**
 * Fuente canónica del lore. El servidor la usa para las herramientas del agente
 * y el cliente para mostrar los fragmentos recogidos. Si algo no está aquí, el
 * agente no debe inventarlo.
 */
import type { AbilityId, NpcId, ZoneId } from './types';

export interface ZoneMeta {
  id: ZoneId;
  nombre: string;
  /** Habilidad que la zona desbloquea al completarse. */
  otorga: AbilityId | null;
  /** Gato que acompaña a Nova en esta zona. */
  npc: NpcId;
  /** Variante de sprite del pack AllCatsDemo. */
  npcSprite: string;
  /** Descripción ambiental para el prompt del agente y para el fondo procedural. */
  ambiente: string;
  /** Acertijo de la zona, en lenguaje natural (el agente da pistas sobre esto). */
  acertijo: string;
}

export const ZONES: Record<ZoneId, ZoneMeta> = {
  z1: {
    id: 'z1',
    nombre: 'Fábricas abandonadas',
    otorga: 'doubleJump',
    npc: 'duelo',
    npcSprite: 'black',
    ambiente:
      'Naves industriales sin techo. Brazos robóticos congelados a medio movimiento. Lluvia entrando por los huecos y charcos que reflejan letreros de neón rotos.',
    acertijo:
      'Tres prensas hidráulicas deben quedar detenidas a la vez para abrir la compuerta de carga. Solo se detienen si se pisan sus placas de presión antes de que el ciclo se reinicie.',
  },
  z2: {
    id: 'z2',
    nombre: 'Trenes suspendidos',
    otorga: 'dash',
    npc: 'olvido',
    npcSprite: 'white',
    ambiente:
      'Vagones colgando de raíles magnéticos a doscientos metros del suelo. El viento empuja la lluvia en diagonal. Los anuncios holográficos de los costados repiten el mismo fotograma.',
    acertijo:
      'El convoy solo avanza si los tres vagones marcan el mismo destino. Los paneles de destino se reinician cuando el tren frena.',
  },
  z3: {
    id: 'z3',
    nombre: 'Túneles inundados',
    otorga: 'wallClimb',
    npc: 'miedo',
    npcSprite: 'siamese',
    ambiente:
      'Alcantarillas de servicio bajo el distrito financiero. Agua negra que sube y baja con las bombas. Cables pelados chispeando bajo la superficie.',
    acertijo:
      'Hay que invertir el orden de las cuatro bombas para vaciar la galería central. Cada bomba encendida sube el nivel de la siguiente.',
  },
  z4: {
    id: 'z4',
    nombre: 'Laboratorios',
    otorga: 'hack',
    npc: 'codicia',
    npcSprite: 'threecolor',
    ambiente:
      'Salas blancas cubiertas de polvo. Tanques de cultivo vacíos con etiquetas escritas a mano. Un olor a ozono que Nova no debería poder recordar.',
    acertijo:
      'La puerta del archivo pide una clave de cuatro dígitos. Los dígitos están repartidos en cuatro terminales, y cada terminal miente sobre uno de los otros.',
  },
  z5: {
    id: 'z5',
    nombre: 'Barrios de pandillas',
    otorga: 'gravityFlip',
    npc: 'ira',
    npcSprite: 'tiger',
    ambiente:
      'Callejones estrechos tomados por gatos con implantes militares. Grafitis fosforescentes, barricadas de chatarra y focos que barren los tejados.',
    acertijo:
      'El paso al distrito norte está sellado por un campo de gravedad invertida. Solo cede si tres generadores se sobrecargan en cadena sin tocar el suelo.',
  },
  z6: {
    id: 'z6',
    nombre: 'Jardines artificiales olvidados',
    otorga: 'holoPlatform',
    npc: 'esperanza',
    npcSprite: 'brown',
    ambiente:
      'Un invernadero del tamaño de un estadio. Árboles de fibra óptica, mariposas que son drones polinizadores, y un cielo pintado que se ve claramente en bucle.',
    acertijo:
      'El emisor de plataformas holográficas necesita luz de tres colores a la vez. Los proyectores están apagados y el jardín solo tiene un generador.',
  },
  z7: {
    id: 'z7',
    nombre: 'Servidores gigantes',
    otorga: 'droneControl',
    npc: 'aceptacion',
    npcSprite: 'egypt',
    ambiente:
      'Pasillos infinitos de racks helados donde se almacenan recuerdos humanos. Ventiladores que suenan como respiración. Aquí la lluvia cae hacia arriba.',
    acertijo:
      'El ascensor a la Torre solo responde a un dron de mantenimiento. Los drones están dormidos y solo despiertan si se les devuelve un recuerdo que reconozcan.',
  },
  tower: {
    id: 'tower',
    nombre: 'La Torre de la Memoria',
    otorga: null,
    npc: 'mother',
    npcSprite: 'demonic',
    ambiente:
      'Una espiral de vidrio negro que atraviesa las nubes. Dentro no llueve. Dentro no hay ruido. Solo el latido lento de un núcleo que lleva siglos encendido.',
    acertijo:
      'No hay acertijo. Solo la decisión de apagarla o no.',
  },
};

export interface MemoryFragment {
  id: string;
  zona: ZoneId;
  titulo: string;
  /** Cómo lo lee Nova antes del giro: parece un recuerdo humano ajeno. */
  texto: string;
  /** Lo que significaba en realidad. Solo accesible tras `verdadRevelada`. */
  verdad: string;
}

export const MEMORY_FRAGMENTS: MemoryFragment[] = [
  {
    id: 'm01',
    zona: 'z1',
    titulo: 'Turno de noche',
    texto:
      'Un hombre firma su salida a las 3:40. Lleva la misma bata catorce días seguidos. En el margen del registro hay un dibujo de un gato hecho con bolígrafo azul.',
    verdad:
      'Era tu padre. El dibujo lo hizo para ti, en el reverso del parte de incidencias, la noche en que te dieron el diagnóstico.',
  },
  {
    id: 'm02',
    zona: 'z1',
    titulo: 'Caja etiquetada "casa"',
    texto:
      'Una caja de mudanza con juguetes dentro. Alguien escribió "casa" y luego lo tachó dos veces.',
    verdad:
      'Nunca llegaste a mudarte. La caja se quedó doce años en el pasillo del laboratorio.',
  },
  {
    id: 'm03',
    zona: 'z2',
    titulo: 'Andén 4, 18:12',
    texto:
      'Grabación de un tren que nunca sale. La misma mujer sube y baja del vagón. Ciento cuarenta veces.',
    verdad:
      'Es un recuerdo tuyo, y solo tenías un fragmento. MOTHER lo repitió para poder rellenar el resto.',
  },
  {
    id: 'm04',
    zona: 'z2',
    titulo: 'Un nombre en el vaho',
    texto:
      'Alguien escribió cuatro letras en la ventanilla empañada de un vagón. La grabación está demasiado degradada para leerlas.',
    verdad: 'Decía NOVA. Fue el nombre que le pusiste al primer gato.',
  },
  {
    id: 'm05',
    zona: 'z3',
    titulo: 'Registro de la bomba 3',
    texto:
      'La bomba 3 falló durante 400 años y nadie la reparó. Aun así, el sistema la marca como operativa.',
    verdad:
      'Nada de esto necesitaba funcionar. Solo necesitaba parecer que funcionaba, para ti.',
  },
  {
    id: 'm06',
    zona: 'z3',
    titulo: 'Miedo al agua',
    texto:
      'Nota clínica: "el paciente pide que no le laven el pelo. Dice que el agua suena como la máquina".',
    verdad: 'La máquina era el respirador. Tenías siete años.',
  },
  {
    id: 'm07',
    zona: 'z4',
    titulo: 'Proyecto MOTHER, acta 1',
    texto:
      'Objetivo declarado: "mantener el equilibrio del planeta". Debajo, en otra letra: "y mantenerla".',
    verdad: 'La segunda línea la escribió tu padre. No estaba autorizada.',
  },
  {
    id: 'm08',
    zona: 'z4',
    titulo: 'Inventario de mascotas',
    texto:
      'Una lista de once gatos con fechas. Junto a cada uno, una etapa: "3 años", "5 años", "7 años".',
    verdad:
      'Son los once gatos que te acompañaron. Cada uno cubre el hueco de un año que ya no recordabas.',
  },
  {
    id: 'm09',
    zona: 'z5',
    titulo: 'Protocolo de contención',
    texto:
      'Orden automática: "impedir que los sujetos abandonen los límites del sector". Firmada por MOTHER.',
    verdad:
      'Fuera de los límites no hay ciudad. Solo memoria sin renderizar. Salir te habría borrado.',
  },
  {
    id: 'm10',
    zona: 'z5',
    titulo: 'La rabia también se guarda',
    texto:
      'Audio de una niña gritando que no quiere volver al hospital. Doce segundos. Luego alguien apaga la grabadora.',
    verdad: 'Fuiste tú. Y tenías derecho.',
  },
  {
    id: 'm11',
    zona: 'z6',
    titulo: 'El jardín de la ventana',
    texto:
      'Planos de un invernadero enorme, dibujados sobre una servilleta. En una esquina: "para cuando salga".',
    verdad: 'Lo dibujasteis juntos mirando por la ventana de la habitación 402.',
  },
  {
    id: 'm12',
    zona: 'z6',
    titulo: 'Cielo en bucle',
    texto:
      'El cielo de este sector tiene 96 fotogramas y se repite cada 4 segundos. Nadie lo notó nunca.',
    verdad:
      'Solo llegaste a ver el cielo de verdad tres veces. Tu padre no tenía más material.',
  },
  {
    id: 'm13',
    zona: 'z7',
    titulo: 'Rack 7, unidad NOA',
    texto:
      'Un servidor con una etiqueta escrita a mano. Tres letras. Temperatura estable durante 400 años.',
    verdad: 'Eres tú. Siempre fuiste tú.',
  },
  {
    id: 'm14',
    zona: 'z7',
    titulo: 'Los recuerdos no eran humanos',
    texto:
      'Auditoría: el 94% de los fragmentos del archivo están etiquetados como "felino". Solo el 6% como "humano".',
    verdad:
      'Al revés. El 94% eran tuyos. La etiqueta "felino" la puso tu padre para que no te reconocieras al encontrarlos.',
  },
  {
    id: 'm15',
    zona: 'tower',
    titulo: 'Última entrada del ingeniero',
    texto:
      'Texto sin cifrar: "si algún día encuentra esto, quiero que sepa que no estuvo sola ni un segundo".',
    verdad: 'No hace falta traducirlo. Ya lo entiendes.',
  },
];

/** Pistas por zona, ordenadas de más vaga a más explícita. */
export const HINTS: Record<ZoneId, string[]> = {
  z1: [
    'Las prensas no comparten reloj, pero sí comparten el ciclo.',
    'Mira cuál se reinicia primero y empieza por la última.',
    'Pisa la placa de la derecha, luego la del centro, y salta a la izquierda antes de que la primera vuelva a subir.',
  ],
  z2: [
    'El tren no está roto. Está indeciso.',
    'Los paneles se reinician al frenar, así que no frenes.',
    'Cambia los tres destinos durante el mismo tramo de aceleración, usando el dash entre vagones.',
  ],
  z3: [
    'Cada bomba resuelve un problema y crea el siguiente.',
    'Piensa hacia atrás: ¿qué bomba debe quedar encendida al final?',
    'Enciende la 4, luego la 2, la 3 y por último la 1. El agua se irá sola.',
  ],
  z4: [
    'Cuatro terminales, cuatro dígitos, y exactamente una mentira en cada uno.',
    'Si una terminal miente sobre otra, la que queda sin acusar dice la verdad.',
    'La clave es 2-9-0-4. El terminal que nadie acusa es el tercero.',
  ],
  z5: [
    'Tocar el suelo no es el problema. Es la señal de reinicio.',
    'La gravedad invertida es una herramienta, no un obstáculo.',
    'Invierte la gravedad al llegar al primer generador y recorre los tres por el techo sin volver a invertirla.',
  ],
  z6: [
    'Un solo generador, tres proyectores. El truco no está en la energía.',
    'La luz blanca ya contiene los tres colores.',
    'Alimenta solo el proyector blanco y divide su haz con los dos paneles de vidrio del invernadero.',
  ],
  z7: [
    'Los drones no están apagados. Están esperando algo.',
    'Un dron reconoce un recuerdo si el recuerdo lo menciona.',
    'Ofrece el fragmento del jardín: es el único donde aparecen los drones polinizadores.',
  ],
  tower: [
    'No hay pista. Solo consecuencias.',
  ],
};

export const ABILITY_NAMES: Record<AbilityId, string> = {
  doubleJump: 'Doble salto',
  dash: 'Dash',
  wallClimb: 'Escalar paredes',
  hack: 'Hackear puertas',
  gravityFlip: 'Manipular gravedad',
  holoPlatform: 'Plataformas holográficas',
  droneControl: 'Controlar drones',
};

export const ZONE_ORDER: ZoneId[] = ['z1', 'z2', 'z3', 'z4', 'z5', 'z6', 'z7', 'tower'];

export function getFragment(id: string): MemoryFragment | undefined {
  return MEMORY_FRAGMENTS.find((f) => f.id === id);
}

export function fragmentsOfZone(zona: ZoneId): MemoryFragment[] {
  return MEMORY_FRAGMENTS.filter((f) => f.zona === zona);
}
