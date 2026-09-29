export const QUOTES = [
  { q: "El éxito es la suma de pequeños esfuerzos repetidos día tras día.", a: "Robert Collier" },
  { q: "No cuentes los días, haz que los días cuenten.", a: "Muhammad Ali" },
  { q: "La disciplina es el puente entre las metas y los logros.", a: "Jim Rohn" },
  { q: "Lo que no te mata te hace más fuerte.", a: "Friedrich Nietzsche" },
  { q: "Somos lo que hacemos repetidamente. La excelencia, entonces, no es un acto sino un hábito.", a: "Aristóteles" },
  { q: "El secreto para salir adelante es comenzar.", a: "Mark Twain" },
  { q: "No es que tengamos poco tiempo, sino que perdemos mucho.", a: "Séneca" },
  { q: "La mejor manera de predecir el futuro es crearlo.", a: "Peter Drucker" },
  { q: "Un viaje de mil millas comienza con un solo paso.", a: "Lao-Tsé" },
  { q: "Si quieres ir rápido, ve solo. Si quieres llegar lejos, ve acompañado.", a: "Proverbio africano" },
  { q: "El talento gana partidos, pero el trabajo en equipo gana campeonatos.", a: "Michael Jordan" },
  { q: "Ninguno de nosotros es tan bueno como todos nosotros juntos.", a: "Ray Kroc" },
  { q: "La constancia es la virtud por la que todas las otras virtudes dan fruto.", a: "Arturo Graf" },
  { q: "Cae siete veces, levántate ocho.", a: "Proverbio japonés" },
  { q: "El único lugar donde el éxito viene antes que el trabajo es en el diccionario.", a: "Vidal Sassoon" },
  { q: "No he fracasado. He encontrado diez mil formas que no funcionan.", a: "Thomas Edison" },
  { q: "Cree que puedes y ya estarás a medio camino.", a: "Theodore Roosevelt" },
  { q: "Nuestra mayor gloria no está en no caer nunca, sino en levantarnos cada vez que caemos.", a: "Confucio" },
  { q: "La motivación te pone en marcha, el hábito te mantiene en movimiento.", a: "Jim Ryun" },
  { q: "Haz lo que puedas, con lo que tengas, donde estés.", a: "Theodore Roosevelt" },
  { q: "La paciencia es amarga, pero su fruto es dulce.", a: "Jean-Jacques Rousseau" },
  { q: "Todo parece imposible hasta que se hace.", a: "Nelson Mandela" },
  { q: "El futuro pertenece a quienes creen en la belleza de sus sueños.", a: "Eleanor Roosevelt" },
  { q: "La calidad nunca es un accidente; siempre es el resultado de un esfuerzo inteligente.", a: "John Ruskin" },
  { q: "No esperes. El momento nunca será el adecuado.", a: "Napoleon Hill" },
  { q: "El trabajo duro vence al talento cuando el talento no trabaja duro.", a: "Tim Notke" },
  { q: "La fuerza no proviene de la capacidad física, sino de una voluntad indomable.", a: "Mahatma Gandhi" },
  { q: "El hombre que mueve montañas empieza apartando piedritas.", a: "Confucio" },
  { q: "Lo que hacemos hoy determina lo que seremos mañana.", a: "Ralph Waldo Emerson" },
  { q: "Ser mejor que ayer, esa es la única competencia que importa.", a: "Anónimo" },
  { q: "El pesimista ve dificultad en cada oportunidad; el optimista ve oportunidad en cada dificultad.", a: "Winston Churchill" },
  { q: "Juntarse es un comienzo; seguir juntos es un progreso; trabajar juntos es el éxito.", a: "Henry Ford" },
  { q: "Cuanto más sudas en el entrenamiento, menos sangras en la batalla.", a: "Proverbio espartano" },
  { q: "No hay atajos para ningún lugar al que valga la pena ir.", a: "Beverly Sills" },
  { q: "Nunca es demasiado tarde para ser lo que podrías haber sido.", a: "George Eliot" },
  { q: "La inspiración existe, pero tiene que encontrarte trabajando.", a: "Pablo Picasso" },
  { q: "Un poco de progreso cada día suma grandes resultados.", a: "Satya Nani" },
  { q: "El que tiene un porqué para vivir puede soportar casi cualquier cómo.", a: "Friedrich Nietzsche" },
  { q: "La grandeza nace de pequeños comienzos.", a: "Sir Francis Drake" },
  { q: "Convierte tus heridas en sabiduría.", a: "Oprah Winfrey" },
  { q: "Sé el cambio que quieres ver en el mundo.", a: "Mahatma Gandhi" },
  { q: "El coraje no siempre ruge. A veces es la voz que al final del día dice: mañana lo intentaré de nuevo.", a: "Mary Anne Radmacher" },
  { q: "Cada logro comienza con la decisión de intentarlo.", a: "John F. Kennedy" },
  { q: "Fija tus metas alto y no te detengas hasta llegar ahí.", a: "Bo Jackson" },
  { q: "El único modo de hacer un gran trabajo es amar lo que haces.", a: "Steve Jobs" },
  { q: "Mide tu progreso en pasos, no en saltos.", a: "Anónimo" },
  { q: "El río corta la roca no por su fuerza, sino por su persistencia.", a: "James N. Watkins" },
  { q: "Las grandes cosas nunca vienen de la zona de confort.", a: "Anónimo" },
  { q: "No mires el reloj; haz lo que él hace: sigue adelante.", a: "Sam Levenson" },
  { q: "Quien no se atreve a nada, no debe esperar nada.", a: "Friedrich Schiller" },
  { q: "La perseverancia no es una carrera larga; son muchas carreras cortas una tras otra.", a: "Walter Elliot" },
  { q: "Tu tiempo es limitado, no lo desperdicies viviendo la vida de otro.", a: "Steve Jobs" },
  { q: "Empieza donde estás. Usa lo que tienes. Haz lo que puedas.", a: "Arthur Ashe" },
  { q: "La unión hace la fuerza.", a: "Esopo" },
  { q: "Trabajar juntos es la mejor forma de multiplicar los resultados.", a: "Anónimo" },
  { q: "Un equipo no es un grupo de personas que trabajan juntas, sino personas que confían unas en otras.", a: "Simon Sinek" },
];

const hash = (str) => {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h >>> 0);
};

export const quoteFor = (userId, seed) => QUOTES[hash(`${userId}|${seed}`) % QUOTES.length];
