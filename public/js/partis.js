const orientations = [
	'Gauche radicale et extrême gauche',
	'Gauche',
	'Centre',
	'Divers',
	'Droite',
	'Droite radicale et extrême droite'
]

export const partis = [
    {
        "abbv": "EXG",
        "nom": "Extrême gauche",
        "orientation": "Gauche radicale et extrême gauche"
    },
    {
        "abbv": "DSV",
        "nom": "Droite souverainiste",
        "orientation": "Droite radicale et extrême droite"
    },
    {
        "abbv": "RN",
        "nom": "Rassemblement National",
        "orientation": "Droite radicale et extrême droite"
    },
    {
        "abbv": "LR",
        "nom": "Les Républicains",
        "orientation": "Droite"
    },
    {
        "abbv": "UG",
        "nom": "Union de la gauche",
        "orientation": "Gauche"
    },
    {
        "abbv": "ENS",
        "nom": "Ensemble ! (Majorité présidentielle)",
        "orientation": "Centre"
    },
    {
        "abbv": "EXD",
        "nom": "Extrême droite",
        "orientation": "Droite radicale et extrême droite"
    },
    {
        "abbv": "DIV",
        "nom": "Divers",
        "orientation": "Divers"
    },
    {
        "abbv": "ECO",
        "nom": "Ecologistes",
        "orientation": "Gauche"
    },
    {
        "abbv": "DVD",
        "nom": "Divers droite",
        "orientation": "Droite"
    },
    {
        "abbv": "REC",
        "nom": "Reconquête !",
        "orientation": "Droite radicale et extrême droite"
    },
    {
        "abbv": "UXD",
        "nom": "Union de l'extrême droite",
        "orientation": "Droite radicale et extrême droite"
    },
    {
        "abbv": "DVG",
        "nom": "Divers gauche",
        "orientation": "Gauche"
    },
    {
        "abbv": "UDI",
        "nom": "Union des Démocrates et Indépendants",
        "orientation": "Centre"
    },
    {
        "abbv": "REG",
        "nom": "Régionaliste",
        "orientation": "Divers"
    },
    {
        "abbv": "DVC",
        "nom": "Divers centre",
        "orientation": "Centre"
    },
    {
        "abbv": "HOR",
        "nom": "Horizons",
        "orientation": "Centre"
    },
    {
        "abbv": "COM",
        "nom": "Parti communiste français",
        "orientation": "Gauche radicale et extrême gauche"
    },
    {
        "abbv": "SOC",
        "nom": "Parti socialiste",
        "orientation": "Gauche"
    },
    {
        "abbv": "FI",
        "nom": "La France insoumise",
        "orientation": "Gauche radicale et extrême gauche"
    },
    {
        "abbv": "VEC",
        "nom": "Les Ecologistes",
        "orientation": "Gauche"
    },
    {
        "abbv": "RDG",
        "nom": "Parti radical de gauche",
        "orientation": "Gauche"
    }
].sort((a, b) => orientations.indexOf(a.orientation) - orientations.indexOf(b.orientation))