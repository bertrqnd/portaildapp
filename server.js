const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const multer = require('multer');


// Configuration de multer pour que les images soient stockées dans le dossier 'public/src'
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/src'); // dossier de destination
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // nom unique
  }
});

const upload = multer({ storage }); // <- utiliser le storage

// Initialisation d'Express
const app = express();
const PORT = 3000;


// Middleware
app.use(express.json());
app.use(express.static('public')); // Servir les fichiers statiques (HTML, CSS, images)

// Route pour récupérer tous les services
app.get('/api/services', async (req, res) => {
  try {
    const data = await fs.readFile('services.json', 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la lecture des services' });
  }
});

// Route pour récupérer les services utilisateurs
app.get('/api/services/users', async (req, res) => {
  try {
    const data = await fs.readFile('services.json', 'utf8');
    const services = JSON.parse(data);
    res.json(services.users);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la lecture des services utilisateurs' });
  }
});

// Route pour récupérer les services admin
app.get('/api/services/admin', async (req, res) => {
  try {
    const data = await fs.readFile('services.json', 'utf8');
    const services = JSON.parse(data);
    res.json(services.admin);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la lecture des services admin' });
  }
});

// Route pour ajouter un nouveau service
app.post('/api/services/:type', upload.single('image'), async (req, res) => {
  try {
    const { type } = req.params; // 'users' ou 'admin'
    const { title, url } = req.body; // champs texte du formulaire

    // Vérification des champs
    if (!title || !url) return res.status(400).json({ error: 'Titre et URL obligatoires' });
    if (!req.file) return res.status(400).json({ error: 'Image obligatoire' });

    const imagePath = `src/${req.file.filename}`; // chemin relatif pour le front

    // Lire le JSON existant
    const data = await fs.readFile('services.json', 'utf8');
    const services = JSON.parse(data);

    if (!services[type]) return res.status(400).json({ error: 'Type invalide' });

    // Ajouter le nouveau service
    services[type].push({ title, url, image: imagePath });

    // Écrire le JSON mis à jour
    await fs.writeFile('services.json', JSON.stringify(services, null, 2));

    res.status(201).json({ message: 'Service ajouté avec succès', service: { title, url, image: imagePath } });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de l\'ajout du service' });
  }
});

// Route pour modifier un service et son image
app.put('/api/services/:type/:title', upload.single('image'), async (req, res) => {
  try {
    const { type, title } = req.params;  // titre actuel pour identifier
    const { url, title: newTitle } = req.body;  // url et nouveau titre
    const imageFile = req.file;  // fichier image uploadé (optionnel)

    if (!url) return res.status(400).json({ error: 'URL obligatoire' });

    // Lire le JSON existant
    const data = await fs.readFile('services.json', 'utf8');
    const services = JSON.parse(data);

    if (!services[type]) return res.status(400).json({ error: 'Type invalide' });

    // Trouver le service à modifier
    const serviceIndex = services[type].findIndex(s => s.title === decodeURIComponent(title));
    if (serviceIndex === -1) return res.status(404).json({ error: 'Service non trouvé' });

    const service = services[type][serviceIndex];

    // Mettre à jour le titre si fourni
    if (newTitle && newTitle !== service.title) service.title = newTitle;

    // Mettre à jour l'URL
    service.url = url;

    // Mettre à jour l'image si un nouveau fichier est fourni
    if (imageFile) {
      // Supprimer l'ancienne image si elle est dans /src
      if (service.image && service.image.startsWith('src/')) {
        const oldImagePath = path.join(__dirname, 'public', service.image);
        fs.unlink(oldImagePath).catch(err => console.error('Erreur suppression image :', err));
      }
      service.image = `src/${imageFile.filename}`;
    }

    // Écrire le JSON mis à jour
    await fs.writeFile('services.json', JSON.stringify(services, null, 2));

    res.json({ message: 'Service modifié avec succès', service });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la modification du service' });
  }
});



// Route pour supprimer un service et son image
app.delete('/api/services/:type/:title', async (req, res) => {
  try {
    const { type, title } = req.params;

    const data = await fs.readFile('services.json', 'utf8');
    const services = JSON.parse(data);

    if (!services[type]) {
      return res.status(400).json({ error: 'Type invalide' });
    }

    // Trouver l'application à supprimer
    const appIndex = services[type].findIndex(s => s.title === decodeURIComponent(title));
    if (appIndex === -1) {
      return res.status(404).json({ error: 'Application non trouvée' });
    }

    const appToDelete = services[type][appIndex];

    // Supprimer le fichier image si elle existe et n'est pas une image existante d'origine
    if (appToDelete.image && appToDelete.image.startsWith('src/')) {
    const imagePath = path.join(__dirname, 'public', appToDelete.image);
    fs.unlink(imagePath).catch(err => console.error('Erreur suppression image :', err));
  }

    // Supprimer l'application du tableau
    services[type].splice(appIndex, 1);
    await fs.writeFile('services.json', JSON.stringify(services, null, 2));
    res.json({ message: 'Service et image supprimés avec succès' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la suppression du service' });
  }
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});