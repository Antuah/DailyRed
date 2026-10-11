# Daily Red

Un combate diario contra Red, inspirado en Pokémon Rojo Fuego. Web estática en español, adaptable a móvil y preparada para GitHub Pages. No necesita servidor, claves, API en ejecución ni una ROM.

## Jugar

Revisa las fichas de tus seis Pokémon y elige el inicial. Después toca a Red en el mapa o pulsa **Hablar con Red** y **Aceptar el reto**. El combate nunca empieza automáticamente.

- Los 151 Pokémon de la primera generación pueden aparecer, sin duplicados.
- Cada plaza sortea una categoría: 74 % comunes, 24 % poco comunes, 2 % legendarios y Mew. La categoría especial incluye Articuno, Zapdos, Moltres, Mewtwo y Mew; aproximadamente un 11,4 % de los equipos contiene al menos uno.
- El equipo es igual para todos durante una fecha UTC y cambia a las 00:00 UTC. Recargar o volver a intentar no vuelve a sortearlo.
- Tu equipo tiene niveles 84–88. Red usa Pikachu (88), Lapras (80), Snorlax (82), Venusaur (84), Charizard (84) y Blastoise (84).
- Puedes atacar, cambiar Pokémon y usar dos Máximas Pociones por combate. Los intentos y victorias se guardan en este navegador; no hay cuentas ni clasificación online.
- La cima usa una vista cenital nevada, sprites originales de Red y Pokémon de campo. Tu Pokémon inicial aparece junto a tu entrenador antes del combate.
- El botón de luna/sol cambia entre modo claro y oscuro. La elección se recuerda en este navegador; si todavía no has elegido, se usa la preferencia del sistema.

El motor recrea un subconjunto de reglas de generación III: estadísticas, tabla de tipos, categorías físicas/especiales por tipo, STAB, precisión, prioridad, críticos, PP, sueño, parálisis, quemadura, congelación, veneno, veneno grave, curación, absorción, retroceso, cambios de estadísticas y Transformación. Incluye 86 movimientos y los elige de los movimientos que cada especie aprende en Rojo Fuego/Verde Hoja. Algunos Pokémon tienen menos de cuatro movimientos compatibles. No implementa habilidades, objetos equipados, clima, confusión, cambios secundarios de estadísticas de ataques ni todos los movimientos o efectos del juego original. Los niveles son comparables; una especie débil sigue siendo un reto mayor.

Esta aplicación es una **recreación web**, no un parche ni un emulador de la ROM adjunta. No incluye archivos GBA.

## Desarrollo local

Requiere Node.js 24 y Python 3 para la vista previa. No hay dependencias npm.

```sh
npm test
npm run dev
```

Abre `http://127.0.0.1:5173`. Para generar la web publicable:

```sh
npm run build
```

El resultado está en `dist/`. Todos los recursos son locales y las rutas relativas funcionan bajo `/DailyRed/`.

## GitHub Pages

Repositorio de destino: [Antuah/DailyRed](https://github.com/Antuah/DailyRed).

1. Sube los archivos a la rama `main`.
2. En el repositorio, abre **Settings → Pages → Build and deployment → Source** y selecciona **GitHub Actions**.
3. El flujo `.github/workflows/pages.yml` ejecuta las pruebas, genera `dist/` y publica el resultado. También se puede iniciar desde **Actions → Publicar Daily Red → Run workflow**.
4. La dirección prevista es `https://antuah.github.io/DailyRed/` una vez que el despliegue termine correctamente.

## Datos y créditos

- Datos: [PokéAPI](https://pokeapi.co/docs/v2), con movimientos de Rojo Fuego/Verde Hoja y ajustes de estadísticas a generación III.
- Sprites: [PokeAPI/sprites](https://github.com/PokeAPI/sprites), directorio `generation-iii/firered-leafgreen`.
- Tipografías: DM Sans y Press Start 2P, SIL Open Font License; licencias incluidas en `assets/fonts/`.
- Mapa, interfaz y sonidos originales de este proyecto.
- Sprites de Red (campo y retrato): [pret/pokefirered](https://github.com/pret/pokefirered).
- Pokémon de campo de HeartGold/SoulSilver: colección de [Veekun](https://veekun.com/dex/downloads), animaciones de [teobz](https://github.com/teobz/pkmn-hgss-animated-overworld-sprites). Estos gráficos pertenecen a los titulares de Pokémon.

Pokémon, sus nombres y personajes pertenecen a Nintendo, Game Freak y Creatures. Proyecto independiente de fans, sin afiliación oficial. No se otorga una licencia sobre recursos de terceros.

Los datos y 302 sprites ya están incluidos: no se contacta con PokéAPI al jugar. `node scripts/fetch-data.mjs` sirve para regenerarlos durante el desarrollo con conexión a Internet.
