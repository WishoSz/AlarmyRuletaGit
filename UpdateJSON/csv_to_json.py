import csv
import json
import os

# Ruta del CSV que descargás de Exportify
csv_path = r"C:\Personal\Proyectos\AlarmyRuletaGit\UpdateJSON\r&m.csv"

# Ruta de la carpeta sincronizada con Google Drive (aquí se guardará el JSON)
json_path = r"C:\Personal\Proyectos\AlarmyRuletaGit\links.json"

# Lista de artistas que serán categorías
artist_categories = [
    "System Of A Down","Metallica","Megadeth","The Warning","Slipknot","BABYMETAL",
    "John 5","Nonpoint","Arch Enemy","Måneskin","John Petrucci","Trivium",
    "Symphony X","In Flames","Avenged Sevenfold","Disturbed","All That Remains",
    "DragonForce","Linkin Park","Children Of Bodom","My Chemical Romance","Darkest Hour"
]

# Diccionario de imágenes por categoría
category_images = {
    "System Of A Down": "images/System Of A Down.jpg",
    "Metallica": "images/Metallica.jpg",
    "Megadeth": "images/Megadeth.jpg",
    "The Warning": "images/The Warning.jpg",
    "Slipknot": "images/Slipknot.jpg",
    "BABYMETAL": "images/BABYMETAL.jpg",
    "John 5": "images/John 5.jpg",
    "Nonpoint": "images/Nonpoint.jpg",
    "Arch Enemy": "images/Arch Enemy.jpg",
    "Måneskin": "images/Måneskin.jpg",
    "John Petrucci": "images/John Petrucci.jpg",
    "Trivium": "images/Trivium.jpg",
    "Symphony X": "images/Symphony X.jpg",
    "In Flames": "images/In Flames.jpg",
    "Avenged Sevenfold": "images/Avenged Sevenfold.jpg",
    "Disturbed": "images/Disturbed.jpg",
    "All That Remains": "images/All That Remains.jpg",
    "DragonForce": "images/DragonForce.jpg",
    "Linkin Park": "images/Linkin Park.jpg",
    "Children Of Bodom": "images/Children Of Bodom.jpg",
    "My Chemical Romance": "images/My Chemical Romance.jpg",
    "Darkest Hour": "images/Darkest Hour.jpg"
}

# Imagen por defecto
default_image = "images/Default.jpg"

items = []

with open(csv_path, newline='', encoding='utf-8') as csvfile:
    reader = csv.DictReader(csvfile)
    for row in reader:
        track_id = row["URI de la canción"].split(":")[-1]
        url = f"https://open.spotify.com/track/{track_id}"
        label = f"{row['Nombre de la canción']} - {row['Nombre(s) del artista']}"

        # Categorías automáticas: cada artista es su propia categoría
        categorias = []
        artista = row["Nombre(s) del artista"].strip()
        if artista in artist_categories:
            categorias.append(artista)
        # Si no coincide, categorias queda como [] (sin categoría)

        # Asignar imagen según categoría
        if categorias and categorias[0] in category_images:
            img = category_images[categorias[0]]
        else:
            img = default_image

        items.append({"label": label, "url": url, "categorias": categorias, "img": img})

# Guardar JSON
with open(json_path, "w", encoding="utf-8") as f:
    json.dump(items, f, indent=2, ensure_ascii=False)

print(f"JSON generado en {json_path} con {len(items)} canciones")
