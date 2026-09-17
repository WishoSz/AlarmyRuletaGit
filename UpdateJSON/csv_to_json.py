import csv
import json

# Ruta del CSV descargado de Exportify
csv_path = r"C:\Personal\Proyectos\AlarmyRuletaGit\UpdateJSON\r&m.csv"

# Ruta donde se guardará el JSON
json_path = r"C:\Personal\Proyectos\AlarmyRuletaGit\links.json"


# ============================================================
# CATEGORÍAS MANUALES
# ============================================================
# Agrega aquí las categorías que quieras crear.
# Dentro de cada categoría coloca los artistas que pertenezcan a ella.

categorias_manuales = {
    "Nu Metal": [
        "System Of A Down",
        "Slipknot",
        "Linkin Park"
    ],

    # Ejemplo:
    # "Speed Metal": [
    #     "DragonForce",
    #     "Artista 2"
    # ]
}


items = []


with open(csv_path, newline='', encoding='utf-8') as csvfile:
    reader = csv.DictReader(csvfile)

    for row in reader:
        # Obtener ID de Spotify
        track_id = row["URI de la canción"].split(":")[-1]

        # Crear URL de Spotify
        url = f"https://open.spotify.com/track/{track_id}"

        # Nombre completo de la canción + artistas
        label = f"{row['Nombre de la canción']} - {row['Nombre(s) del artista']}"

        # ----------------------------------------------------
        # ARTISTAS
        # ----------------------------------------------------
        # Exportify guarda los artistas separados por comas.
        artists = [
            artist.strip()
            for artist in row["Nombre(s) del artista"].split(",")
            if artist.strip()
        ]

        # ----------------------------------------------------
        # CATEGORÍAS
        # ----------------------------------------------------
        # Una canción recibe una categoría si al menos uno
        # de sus artistas pertenece a esa categoría.
        categorias = []

        for categoria, artistas_categoria in categorias_manuales.items():
            if any(artist in artistas_categoria for artist in artists):
                categorias.append(categoria)

        # ----------------------------------------------------
        # CREAR ELEMENTO
        # ----------------------------------------------------
        items.append({
            "label": label,
            "url": url,
            "artist": artists,
            "categorias": categorias
        })


# Guardar JSON
with open(json_path, "w", encoding="utf-8") as f:
    json.dump(items, f, indent=2, ensure_ascii=False)


print(f"JSON generado en {json_path} con {len(items)} canciones")