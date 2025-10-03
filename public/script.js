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

        return card;
    }

    // Toggle du formulaire et changement du bouton
    toggleForm.addEventListener('click', () => {
        const showing = formContainer.style.display === 'block';
        if (!showing) {
            formContainer.style.display = 'block';
            userContainer.classList.add('show-delete');
            adminContainer.classList.add('show-delete');
            toggleForm.textContent = '-';
            toggleForm.classList.add('active');
        } else {
            formContainer.style.display = 'none';
            userContainer.classList.remove('show-delete');
            adminContainer.classList.remove('show-delete');
            toggleForm.textContent = '+';
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

        if (!title || !url ) {
            alert("Vous devez donner un titre et une URL");
            return;
        }


        if (imageFile && imageFile.size > 2 * 1024 * 1024) { 
            alert("La taille de l'image ne doit pas dépasser 2MB");
            return;
        }

        //type mm

        const formData = new FormData();
        formData.append('title', title);
        formData.append('url', url);

        if (!imageFile) {
            const defaultImageUrl = '/src/default.png'; 
            const response = await fetch(defaultImageUrl);
            const blob = await response.blob();
            const defaultFile = new File([blob], 'default.png', { type: blob.type });
            formData.append('image', defaultFile);
            } else {
                    formData.append('image', imageFile);
                    }

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
