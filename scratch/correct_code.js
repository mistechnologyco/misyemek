        function renderRestaurants() {
            const container = document.getElementById('restaurants-container');
            container.innerHTML = '';
            
            // Aktif kategori 'All' değilse listeyi filtrele
            let listToRender = activeCategory === 'All' 
                ? dynamicRestaurants 
                : dynamicRestaurants.filter(res => res.type === activeCategory);

            if(listToRender.length === 0) {
                container.innerHTML = `<div class="empty-state">Bu kategoride yakınlarda restoran bulunamadı. <i class="fa-regular fa-face-frown"></i></div>`;
                return;
            }

            listToRender.forEach(res => {
                let sponsorBadge = res.sponsor ? `<span class="badge sponsor">Sponsorlu</span>` : `<span class="badge">Yeni</span>`;
                container.innerHTML += `
                    <div class="restaurant-card" onclick="openMenu(${res.id})">
                        <div class="res-img-wrap">
                            <div class="promos">${sponsorBadge}</div>
                            <div class="distance-tag"><i class="fa-solid fa-location-dot" style="color:var(--primary)"></i> ${res.distance} km</div>
                            <img src="${res.img}" alt="${res.name}">
                        </div>
                        <div class="res-info">
                            <h3>${res.name}</h3>
                            <p>${res.type}</p>
                            <div class="res-meta">
                                <span class="rating"><i class="fa-solid fa-star"></i> ${res.rating} (500+)</span>
                                <span class="delivery-fee"><i class="fa-solid fa-motorcycle"></i> Ücretsiz Teslimat</span>
                            </div>
                        </div>
                    </div>
                `;
            });
        }

        function openMenu(resId) {
            activeRestaurant = dynamicRestaurants.find(r => r.id === resId);
            document.getElementById('menu-res-header').innerHTML = `
                <img src="${activeRestaurant.img}" alt="Res">
                <div>
                    <h2>${activeRestaurant.name}</h2>
                    <p>${activeRestaurant.type} • <i class="fa-solid fa-star" style="color:var(--warning)"></i> ${activeRestaurant.rating}</p>
                </div>
            `;
            const menuContainer = document.getElementById('menu-items-container');
            menuContainer.innerHTML = '';
            activeRestaurant.menu.forEach(item => {
                menuContainer.innerHTML += `
                    <div class="menu-item">
                        <img class="menu-item-img" src="${item.img}" alt="${item.name}">
                        <div class="menu-item-info">
                            <h4>${item.name}</h4>
                            <p>${item.desc}</p>
                            <span>${item.price} TL</span>
                        </div>
                        <button class="add-btn" onclick="addToCart(${item.id}, '${item.name}', ${item.price})"><i class="fa-solid fa-plus"></i></button>
                    </div>
                `;
            });
            document.getElementById('menu-modal').style.display = 'flex';
        }

        function addToCart(id, name, price) {
            let existingItem = cart.find(item => item.id === id);
            if(existingItem) existingItem.qty += 1;
            else cart.push({ id, name, price, qty: 1 });
            updateCartUI();
            showToast(name + ' sepete eklendi!');
        }

        function changeQty(id, amount) {
            let item = cart.find(item => item.id === id);
            if(item) {
                item.qty += amount;
                if(item.qty <= 0) cart = cart.filter(i => i.id !== id);
            }
            updateCartUI();
        }
