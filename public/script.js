document.addEventListener('DOMContentLoaded', () => {

    // Conteneurs
    const userContainer = document.getElementById('userapp-container');
    const adminContainer = document.getElementById('adminapp-container');
    const toggleForm = document.getElementById('toggle-form');
    const formContainer = document.getElementById('form-container');
    const appForm = document.getElementById('appForm');


    // Récupération des services
    async function fetchServices() {
        try {
            const reponse = await fetch("/api/services"); // ✅ chemin relatif
            const services = await reponse.json();

            userContainer.innerHTML = '';
            adminContainer.innerHTML = '';

            // Tri des applications par ordre alphabétique
            services.users.sort((a, b) => a.title.localeCompare(b.title));
            services.admin.sort((a, b) => a.title.localeCompare(b.title));

            // Affichage des applications
            services.users.forEach(app => userContainer.appendChild(createAppCard(app, 'users')));
            services.admin.forEach(app => adminContainer.appendChild(createAppCard(app, 'admin')));
        } catch (error) {
            console.error('Erreur lors de la récupération des services :', error);
        }
    }


    // Fonction pour activer le mode édition
    function enableEditMode(card, app, type) {
    card.innerHTML = ''; // vider le contenu normal
    card.classList.add('editing'); // classe CSS pour le mode édition

    // Conteneur image
    const imgContainer = document.createElement('div');
    imgContainer.className = 'edit-img-container';

    const previewImg = document.createElement('img');
    previewImg.src = app.image;
    previewImg.alt = "Logo actuel";
    previewImg.className = 'edit-preview-img';
    imgContainer.appendChild(previewImg);

    // Conteneur texte / inputs
    const inputContainer = document.createElement('div');
    inputContainer.className = 'edit-input-container';

    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.value = app.title;
    titleInput.className = 'edit-title-input';

    const urlInput = document.createElement('input');
    urlInput.type = 'text';
    urlInput.value = app.url;
    urlInput.className = 'edit-url-input';

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.className = 'edit-file-input';

    const btnContainer = document.createElement('div');
    btnContainer.className = 'edit-btn-container';

    const saveBtn = document.createElement('button');
    saveBtn.textContent = '💾';
    saveBtn.className = 'edit-save-btn';

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = '❌';
    cancelBtn.className = 'edit-cancel-btn';

    btnContainer.appendChild(saveBtn);
    btnContainer.appendChild(cancelBtn);

    inputContainer.appendChild(titleInput);
    inputContainer.appendChild(urlInput);
    inputContainer.appendChild(fileInput);
    inputContainer.appendChild(btnContainer);

    card.appendChild(imgContainer);
    card.appendChild(inputContainer);

    // --- Sauver ---
    saveBtn.addEventListener('click', async () => {
        const formData = new FormData();
        formData.append('title', titleInput.value.trim());
        formData.append('url', urlInput.value.trim());
        if (fileInput.files[0]) {
            formData.append('image', fileInput.files[0]);
        }

        if (!fileInput.files[0]) {
            const defaultImageUrl = '/src/default.png'; 
            const response = await fetch(defaultImageUrl);
            const blob = await response.blob();
            const defaultFile = new File([blob], 'default.png', { type: blob.type });
            formData.append('image', defaultFile);
            }

        try {
            const res = await fetch(`/api/services/${type}/${encodeURIComponent(app.title)}`, {
                method: 'PUT',
                body: formData
            });
            if (res.ok) fetchServices();
            else {
                const data = await res.json();
                alert(`Erreur : ${data.error}`);
            }
        } catch (err) {
            console.error('Erreur modification :', err);
        }
    });

    // --- Annuler ---
    cancelBtn.addEventListener('click', () => {
        const parent = card.parentNode;
        const newCard = createAppCard(app, type);
        parent.replaceChild(newCard, card);
        card.classList.remove('editing');
    });

    // --- Fermer le mode édition avec le bouton en haut à droite ---
    const topButton = document.getElementById('toggle-form');
    const closeEditListener = () => cancelBtn.click();
    topButton.addEventListener('click', closeEditListener);

    cancelBtn.addEventListener('click', () => {
        topButton.removeEventListener('click', closeEditListener);
    });
}



    // Création d'une carte d'application
    function createAppCard(app, type) {
        const card = document.createElement('div');
        card.className = 'app-card';
        card.style.position = 'relative';

        // Lien
        const link = document.createElement('a');
        link.href = app.url || '#';
        link.target = '_blank';
        if (!app.url) {
            link.style.pointerEvents = 'none';
            link.style.opacity = '0.5';
        }

        // Logo
        const img = document.createElement('img');
        img.src = app.image; 
        img.alt = app.title;

        // Titre
        const title = document.createElement('p');
        title.textContent = app.title;

        link.appendChild(img);
        link.appendChild(title);
        card.appendChild(link);

        // Bouton de suppression
        const deleteBtn = document.createElement('span');
        deleteBtn.textContent = '✖';
        deleteBtn.className = 'delete-btn';
        deleteBtn.addEventListener('click', async () =>  {
                try {
                    await fetch(`/api/services/${type}/${encodeURIComponent(app.title)}`, {
                        method: 'DELETE'
                    });
                    fetchServices();
                } catch (err) {
                    console.error('Erreur lors de la suppression :', err);
                }
            }
        );
        card.appendChild(deleteBtn);

            // --- Bouton édition ---
        const editBtn = document.createElement('span');
        editBtn.textContent = '✎';
        editBtn.className = 'edit-btn';
        editBtn.addEventListener('click', () => enableEditMode(card, app, type));
        card.appendChild(editBtn);

        return card;
    }

    // Toggle du formulaire et changement du bouton
    toggleForm.addEventListener('click', () => {
    const showing = formContainer.style.display === 'block';
    if (!showing) {
        formContainer.style.display = 'block';
        userContainer.classList.add('show-delete');
        adminContainer.classList.add('show-delete');
        toggleForm.textContent = '✖';
        toggleForm.classList.add('active');
    } else {
        formContainer.style.display = 'none';
        userContainer.classList.remove('show-delete');
        adminContainer.classList.remove('show-delete');
        toggleForm.textContent = '✎';
        toggleForm.classList.remove('active');
    }
    });

    // Soumission du formulaire
    appForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const type = document.getElementById('type').value;
        const title = document.getElementById('title').value.trim();
        const url = document.getElementById('url').value.trim();
        const imageFile = document.getElementById('image').files[0];
        
        // Validation
        if (!title || !url ) {
            alert("Vous devez donner un titre et une URL");
            return;
        }

        // Type MIME image
        if(imageFile){
            const validImageTypes = ['image/jpeg', 'image/png','image/webp'];
            if (!validImageTypes.includes(imageFile.type)) {
                alert("Le fichier doit être une image (jpg, png, webp)");
                return;
            }
        }

        // Taille max 2MB
        if (imageFile && imageFile.size > 2 * 1024 * 1024) { 
            alert("La taille de l'image ne doit pas dépasser 2MB");
            return;
        }

        // Préparation des données du formulaire
        const formData = new FormData();
        formData.append('title', title);
        formData.append('url', url);

        // Si pas d'image, utiliser l'image par défaut
        if (!imageFile) {
            const defaultImageUrl = '/src/default.png'; 
            const response = await fetch(defaultImageUrl);
            const blob = await response.blob();
            const defaultFile = new File([blob], 'default.png', { type: blob.type });
            formData.append('image', defaultFile);
            } else {
                    formData.append('image', imageFile);
                    }


        // Envoi de la requête
        try {
            const res = await fetch(`/api/services/${type}`, { 
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                appForm.reset();
                formContainer.style.display = 'none';
                userContainer.classList.remove('show-delete');
                adminContainer.classList.remove('show-delete');
                fetchServices();
            } else {
                const data = await res.json();
                alert(`Erreur : ${data.error}`);
            }
        } catch (err) {
            console.error('Erreur lors de l\'ajout du service :', err);
        }
    });

    fetchServices();
});
