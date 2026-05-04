
        // ==================== FIREBASE ====================
        import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
        import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
        import { getFirestore, doc, setDoc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

        const firebaseConfig = {
            apiKey: "AIzaSyCnkFtEAlHmFecB4SCbqJZcmZ56GSC6cnk",
            authDomain: "yemek-d7622.firebaseapp.com",
            projectId: "yemek-d7622",
            storageBucket: "yemek-d7622.firebasestorage.app",
            messagingSenderId: "210743067656",
            appId: "1:210743067656:web:f190db881c05107750fdbd",
            measurementId: "G-08RGPQQK3F"
        };

        const app  = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        const db   = getFirestore(app);

        // Global fonksiyonları window'a bağla (HTML onclick için)
        window._fb = { auth, db, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, doc, setDoc, getDoc, updateDoc };

        let userLat = 39.9207; 
        let userLng = 32.8541;
        let cart = [];
        let activeRestaurant = null;
        let activeCategory = 'All';
        let mapInitialized = false;
        let map, routeControl, kuryeMarker, animasyonInterval;
        let totalOrderCount = 0;

        // 14 FARKLI RESTORAN VE MENÜSÜ EKLENDİ
        const resTemplates = [
            { name: "Burger Station", type: "Burger", sponsor: true, img: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=500&q=80",
                menu: [ { id: 101, name: "Texas Burger", price: 210, desc: "Füme et, cheddar", img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=150" } ] },
            { name: "Smash Burger Co.", type: "Burger", sponsor: false, img: "https://images.unsplash.com/photo-1586816001966-79b736744398?w=500&q=80",
                menu: [ { id: 102, name: "Double Smash", price: 240, desc: "Çift köfte, özel sos", img: "https://images.unsplash.com/photo-1594212691516-e82fa43ba62a?w=150" } ] },
            
            { name: "Napoli Pizza", type: "Pizza", sponsor: false, img: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&q=80",
                menu: [ { id: 201, name: "Margarita Pizza", price: 190, desc: "Mozzarella, fesleğen", img: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=150" } ] },
            { name: "Pizza Roma", type: "Pizza", sponsor: true, img: "https://images.unsplash.com/photo-1590947132387-155cc02f3212?w=500&q=80",
                menu: [ { id: 202, name: "Pepperoni", price: 230, desc: "Bol pepperoni", img: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=150" } ] },
            
            { name: "Usta Kebap", type: "Kebap", sponsor: true, img: "https://images.unsplash.com/photo-1645696301019-35adcc18fc21?w=500&q=80",
                menu: [ { id: 301, name: "Adana Kebap", price: 220, desc: "Zırh kıyması", img: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=150" } ] },
            { name: "Antep Sofrası", type: "Kebap", sponsor: false, img: "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=500&q=80",
                menu: [ { id: 302, name: "Urfa Porsiyon", price: 210, desc: "Acısız kebap", img: "https://images.unsplash.com/photo-1654877395066-5867ec6b80d0?w=150" } ] },
            
            { name: "Sokak Dönercisi", type: "Döner", sponsor: false, img: "https://images.unsplash.com/photo-1627308595229-7830f5c90683?w=500&q=80",
                menu: [ { id: 401, name: "Et Döner Dürüm", price: 160, desc: "Özel lavaş arası", img: "https://images.unsplash.com/photo-1627308595229-7830f5c90683?w=150" } ] },
            { name: "Tarihi Dönerci", type: "Döner", sponsor: true, img: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=500&q=80",
                menu: [ { id: 402, name: "Tavuk Döner", price: 110, desc: "Bol soslu", img: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=150" } ] },
            
            { name: "Tatlıcı Bey", type: "Tatlı", sponsor: true, img: "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=500&q=80",
                menu: [ { id: 501, name: "Soğuk Baklava", price: 250, desc: "Fıstıklı, sütlü", img: "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=150" } ] },
            { name: "Çikolata Atölyesi", type: "Tatlı", sponsor: false, img: "https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=500&q=80",
                menu: [ { id: 502, name: "San Sebastian", price: 120, desc: "Çikolata soslu", img: "https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=150" } ] },

            { name: "Piliç Dünyası", type: "Tavuk", sponsor: false, img: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=500&q=80",
                menu: [ { id: 601, name: "Kekikli Tavuk", price: 180, desc: "Makarna ve salata ile", img: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=150" } ] },
            { name: "Çıtır Kova", type: "Tavuk", sponsor: true, img: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=500&q=80",
                menu: [ { id: 602, name: "Karışık Kova", price: 210, desc: "Kanat ve but", img: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=150" } ] },

            { name: "Kahve Durağı", type: "Kahve", sponsor: false, img: "https://images.unsplash.com/photo-1541167760496-1628856ab772?w=500&q=80",
                menu: [ { id: 701, name: "Iced Latte", price: 85, desc: "Buz gibi soğuk", img: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=150" },
                        { id: 703, name: "Cappuccino", price: 75, desc: "Köpüklü espresso", img: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=150" } ] },
            { name: "Roastery Co.", type: "Kahve", sponsor: true, img: "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=500&q=80",
                menu: [ { id: 702, name: "Filtre Kahve", price: 65, desc: "%100 Arabica", img: "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=150" },
                        { id: 704, name: "Cold Brew", price: 95, desc: "12 saat demleme", img: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=150" } ] },

            { name: "Balık Evi", type: "Deniz Ürünleri", sponsor: false, img: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=500&q=80",
                menu: [ { id: 801, name: "Levrek Izgara", price: 320, desc: "Taze levrek, limon", img: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=150" },
                        { id: 802, name: "Karides Güveç", price: 280, desc: "Domates soslu", img: "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=150" } ] },
            { name: "Deniz Sofrası", type: "Deniz Ürünleri", sponsor: true, img: "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=500&q=80",
                menu: [ { id: 803, name: "Balık Ekmek", price: 120, desc: "Taze balık, soğan", img: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=150" },
                        { id: 804, name: "Midye Dolma", price: 90, desc: "Pirinçli, baharatlı", img: "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=150" } ] },

            { name: "Vegan Mutfak", type: "Vegan", sponsor: false, img: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&q=80",
                menu: [ { id: 901, name: "Avokado Toast", price: 130, desc: "Tam buğday, avokado", img: "https://images.unsplash.com/photo-1541519227354-08fa5d50c820?w=150" },
                        { id: 902, name: "Yeşil Bowl", price: 150, desc: "Kinoa, sebze", img: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=150" } ] },
            { name: "Green Garden", type: "Vegan", sponsor: true, img: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&q=80",
                menu: [ { id: 903, name: "Falafel Dürüm", price: 110, desc: "Nohut köftesi, tahin", img: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=150" },
                        { id: 904, name: "Smoothie Bowl", price: 120, desc: "Meyve, granola", img: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=150" } ] },

            { name: "Çorba Evi", type: "Çorba", sponsor: false, img: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=500&q=80",
                menu: [ { id: 1001, name: "Mercimek Çorbası", price: 65, desc: "Geleneksel tarif", img: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=150" },
                        { id: 1002, name: "Ezogelin Çorbası", price: 70, desc: "Baharatlı, doyurucu", img: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=150" } ] },
            { name: "Sıcak Kaşık", type: "Çorba", sponsor: true, img: "https://images.unsplash.com/photo-1603105037880-880cd4edfb0d?w=500&q=80",
                menu: [ { id: 1003, name: "İşkembe Çorbası", price: 80, desc: "Sarımsaklı, sirkeli", img: "https://images.unsplash.com/photo-1603105037880-880cd4edfb0d?w=150" },
                        { id: 1004, name: "Domates Çorbası", price: 60, desc: "Kremalı, taze", img: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=150" } ] },

            { name: "Pasta & Börek", type: "Börek", sponsor: false, img: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&q=80",
                menu: [ { id: 1101, name: "Su Böreği", price: 95, desc: "Peynirli, ev yapımı", img: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=150" },
                        { id: 1102, name: "Sigara Böreği", price: 75, desc: "Çıtır, peynirli", img: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=150" } ] },
            { name: "Fırın Köşesi", type: "Börek", sponsor: true, img: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&q=80",
                menu: [ { id: 1103, name: "Ispanaklı Börek", price: 85, desc: "Taze ıspanak", img: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=150" },
                        { id: 1104, name: "Kıymalı Pide", price: 110, desc: "Özel kıyma harcı", img: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=150" } ] }
        ];

        let dynamicRestaurants = [];

        window.onload = () => {
            // Konum al
            if ("geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        userLat = position.coords.latitude;
                        userLng = position.coords.longitude;
                        document.getElementById('location-status').innerHTML = '<i class="fa-solid fa-check"></i> Konum Bulundu';
                        generateNearbyRestaurants();
                    },
                    (error) => {
                        document.getElementById('location-status').innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Varsayılan Konum Kullanılıyor';
                        generateNearbyRestaurants();
                    }
                );
            } else {
                generateNearbyRestaurants();
            }
        };

        function generateNearbyRestaurants() {
            dynamicRestaurants = resTemplates.map((template, index) => {
                let latOffset = (Math.random() - 0.5) * 0.04; 
                let lngOffset = (Math.random() - 0.5) * 0.04;
                let rLat = userLat + latOffset;
                let rLng = userLng + lngOffset;
                let distance = calculateDistance(userLat, userLng, rLat, rLng);

                return {
                    id: index, name: template.name, img: template.img, type: template.type,
                    sponsor: template.sponsor, menu: template.menu,
                    lat: rLat, lng: rLng, distance: distance.toFixed(1),
                    rating: (Math.random() * (5.0 - 4.0) + 4.0).toFixed(1)
                };
            });
            dynamicRestaurants.sort((a, b) => a.distance - b.distance);
            renderRestaurants();
        }

        // KATEGORİ FİLTRELEME FONKSİYONU
        function filterCategory(category) {
            // Eğer seçili olan kategoriye tekrar tıklanırsa filtreyi kaldır
            if (activeCategory === category) {
                activeCategory = 'All';
                document.querySelectorAll('.cat-box').forEach(el => el.classList.remove('active'));
                document.getElementById('section-title').innerText = "Sana Özel Restoranlar";
            } else {
                // Yeni bir kategori seçilirse
                activeCategory = category;
                document.querySelectorAll('.cat-box').forEach(el => el.classList.remove('active'));
                const catEl = document.getElementById('cat-' + category);
                if(catEl) catEl.classList.add('active');
                document.getElementById('section-title').innerText = `Yakındaki ${category} Restoranları`;
            }
            renderRestaurants();
        }

        function calculateDistance(lat1, lon1, lat2, lon2) {
            const R = 6371; const dLat = (lat2 - lat1) * Math.PI / 180; const dLon = (lon2 - lon1) * Math.PI / 180;
            const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
            return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        }

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
        }

        function changeQty(id, amount) {
            let item = cart.find(item => item.id === id);
            if(item) {
                item.qty += amount;
                if(item.qty <= 0) cart = cart.filter(i => i.id !== id);
            }
            updateCartUI();
        }

        function updateCartUI() {
            let totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
            document.getElementById('cart-count').innerText = totalItems;
            const cartContainer = document.getElementById('cart-items-container');
            const totalSection = document.getElementById('cart-total-section');
            const checkoutBtn = document.getElementById('checkout-btn');
            if (cart.length === 0) {
                cartContainer.innerHTML = '<p style="color: var(--text-light); text-align: center; padding: 20px 0;">Sepetiniz şu an boş.</p>';
                totalSection.style.display = 'none';
                checkoutBtn.style.display = 'none';
                return;
            }
            cartContainer.innerHTML = '';
            let total = 0;
            cart.forEach((item) => {
                total += (item.price * item.qty);
                cartContainer.innerHTML += `
                    <div class="cart-item">
                        <div class="cart-item-info">
                            <span class="cart-item-name">${item.name}</span>
                            <span class="cart-item-price">${item.price} TL</span>
                        </div>
                        <div class="cart-qty-controls">
                            <button class="qty-btn" onclick="changeQty(${item.id}, -1)">-</button>
                            <span style="font-weight:bold; font-size: 16px;">${item.qty}</span>
                            <button class="qty-btn" onclick="changeQty(${item.id}, 1)">+</button>
                        </div>
                    </div>
                `;
            });
            document.getElementById('cart-total-price').innerText = total + " TL";
            totalSection.style.display = 'flex';
            checkoutBtn.style.display = 'block';
        }

        function openCart() { closeModals(); document.getElementById('cart-modal').style.display = 'flex'; }
        function openAddressSelection() {
            if (!currentUID) { showLoginRequired(); return; }
            renderDeliveryAddresses();
            closeModals();
            document.getElementById('address-modal').style.display = 'flex';
        }

        function renderDeliveryAddresses() {
            const list = document.getElementById('delivery-address-list');
            let html = `
                <div class="address-item selected" onclick="selectAddressOption(this)">
                    <div>
                        <strong>📍 Mevcut Konum (GPS)</strong>
                        <p style="font-size:13px;color:var(--text-light);margin-top:4px;">Haritada tespit edilen anlık konumunuz</p>
                    </div>
                    <i class="fa-solid fa-circle-check" style="color:var(--primary);font-size:22px;"></i>
                </div>`;
            savedAddresses.forEach((a, i) => {
                html += `
                <div class="address-item" onclick="selectAddressOption(this)">
                    <div>
                        <strong>${a.title}</strong>
                        <p style="font-size:13px;color:var(--text-light);margin-top:4px;">${a.city}, ${a.district} — ${a.street} ${a.no}</p>
                    </div>
                    <i class="fa-regular fa-circle" style="color:var(--border);font-size:22px;"></i>
                </div>`;
            });
            list.innerHTML = html;
        }
        function openProfile() {
            if (!currentUID) { showLoginRequired(); return; }
            document.getElementById('stat-orders').innerText = totalOrderCount;
            openSubPanel('main');
            closeModals();
            document.getElementById('profile-modal').style.display = 'flex';
        }

        // ==================== AUTH ====================
        let userProfile = {};
        let savedAddresses = [];
        let savedCards = [];
        let orderHistory = [];
        let currentUID = null;
        let sessionLoaded = false;

        function showLoginRequired() {
            closeModals();
            const ls = document.getElementById('login-screen');
            ls.style.display = 'flex';
            ls.style.alignItems = 'center';
            ls.style.justifyContent = 'center';
        }

        function switchLoginTab(tab) {
            document.querySelectorAll('.login-tab').forEach((t,i) =>
                t.classList.toggle('active', (tab==='login'&&i===0)||(tab==='res-login'&&i===1)||(tab==='register'&&i===2)||(tab==='restaurant'&&i===3))
            );
            document.getElementById('tab-login').classList.toggle('active', tab==='login');
            if(document.getElementById('tab-res-login')) document.getElementById('tab-res-login').classList.toggle('active', tab==='res-login');
            document.getElementById('tab-register').classList.toggle('active', tab==='register');
            document.getElementById('tab-restaurant').classList.toggle('active', tab==='restaurant');
            document.getElementById('login-error').style.display = 'none';
            if(document.getElementById('res-login-error')) document.getElementById('res-login-error').style.display = 'none';
            document.getElementById('register-error').style.display = 'none';
            document.getElementById('restaurant-error').style.display = 'none';
        }

        async function doLogin() {
            const email = document.getElementById('login-email').value.trim();
            const pass  = document.getElementById('login-password').value;
            const errEl = document.getElementById('login-error');
            const btn   = document.querySelector('#tab-login .save-btn');
            errEl.style.display = 'none';
            if (!email || !pass) { errEl.innerText='E-posta ve şifre zorunludur.'; errEl.style.display='block'; return; }
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Giriş yapılıyor...';
            try {
                const cred = await window._fb.signInWithEmailAndPassword(window._fb.auth, email, pass);
                await loadUserSession(cred.user.uid);
                document.getElementById('login-screen').style.display = 'none';
            } catch(e) {
                const msgs = {
                    'auth/user-not-found':'Bu e-posta ile kayıtlı hesap bulunamadı.',
                    'auth/wrong-password':'Şifre hatalı.',
                    'auth/invalid-credential':'E-posta veya şifre hatalı.',
                    'auth/too-many-requests':'Çok fazla deneme. Lütfen bekleyin.'
                };
                errEl.innerText = msgs[e.code] || 'Giriş başarısız. Lütfen tekrar deneyin.';
                errEl.style.display = 'block';
            } finally {
                btn.disabled = false;
                btn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Giriş Yap';
            }
        }

        async function doResLogin() {
            const email = document.getElementById('res-login-email').value.trim();
            const pass  = document.getElementById('res-login-password').value;
            const errEl = document.getElementById('res-login-error');
            const btn   = document.querySelector('#tab-res-login .save-btn');
            errEl.style.display = 'none';
            if (!email || !pass) { errEl.innerText='E-posta ve şifre zorunludur.'; errEl.style.display='block'; return; }
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> İşletme doğrulanıyor...';
            try {
                const cred = await window._fb.signInWithEmailAndPassword(window._fb.auth, email, pass);
                
                window._forceRestaurantUI = true; // Race condition önleyici
                await window._fb.setDoc(window._fb.doc(window._fb.db, 'users', cred.user.uid), { role: 'restaurant' }, { merge: true });
                
                await loadUserSession(cred.user.uid, true);
                
                userProfile.role = 'restaurant';
                applyProfileToUI();

                document.getElementById('login-screen').style.display = 'none';
            } catch(e) {
                const msgs = {
                    'auth/invalid-credential':'E-posta veya şifre hatalı.',
                    'auth/invalid-login-credentials':'E-posta veya şifre hatalı.',
                    'auth/user-not-found':'Hesap bulunamadı.',
                    'auth/wrong-password':'Şifre hatalı.'
                };
                errEl.innerText = msgs[e.code] || ('Giriş başarısız: ' + e.message);
                errEl.style.display = 'block';
            } finally {
                btn.disabled = false;
                btn.innerHTML = '<i class="fa-solid fa-store"></i> İşletme Paneline Gir';
            }
        }

        async function doRegister() {
            const fn           = document.getElementById('reg-firstname').value.trim();
            const ln           = document.getElementById('reg-lastname').value.trim();
            const email        = document.getElementById('reg-email').value.trim();
            const phone        = document.getElementById('reg-phone').value.trim();
            const pass         = document.getElementById('reg-password').value;
            const addrTitle    = document.getElementById('reg-addr-title').value.trim();
            const addrCity     = document.getElementById('reg-addr-city').value;
            const addrDistrict = document.getElementById('reg-addr-district').value.trim();
            const addrStreet   = document.getElementById('reg-addr-street').value.trim();
            const addrNo       = document.getElementById('reg-addr-no').value.trim();
            const errEl = document.getElementById('register-error');
            const btn   = document.querySelector('#tab-register .save-btn');
            errEl.style.display = 'none';
            if (!fn||!ln||!email||!pass) { errEl.innerText='Ad, soyad, e-posta ve şifre zorunludur.'; errEl.style.display='block'; return; }
            if (pass.length < 8) { errEl.innerText='Şifre en az 8 karakter olmalıdır.'; errEl.style.display='block'; return; }
            if (!addrTitle||!addrDistrict||!addrStreet) { errEl.innerText='Lütfen teslimat adresinizi eksiksiz girin.'; errEl.style.display='block'; return; }
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Hesap oluşturuluyor...';
            try {
                const { auth, db, createUserWithEmailAndPassword, doc, setDoc } = window._fb;
                const cred = await createUserWithEmailAndPassword(auth, email, pass);
                const uid  = cred.user.uid;
                const initAddr = { title:addrTitle, city:addrCity, district:addrDistrict, street:addrStreet, no:addrNo, desc:'' };
                await setDoc(doc(db, 'users', uid), {
                    firstname:fn, lastname:ln, email, phone, birthdate:'',
                    addresses:[initAddr], cards:[], orders:[], orderCount:0
                });
                userProfile = { firstname: fn, lastname: ln, email, phone, birthdate: '', role: 'user' };
                savedAddresses = [initAddr];
                sessionLoaded = true;
                applyProfileToUI();
                document.getElementById('login-screen').style.display = 'none';
            } catch(e) {
                const msgs = {
                    'auth/email-already-in-use':'Bu e-posta zaten kayıtlı.',
                    'auth/invalid-email':'Geçersiz e-posta adresi.',
                    'auth/weak-password':'Şifre çok zayıf.'
                };
                errEl.innerText = msgs[e.code] || ('Kayıt başarısız: ' + e.message);
                errEl.style.display = 'block';
            } finally {
                btn.disabled = false;
                btn.innerHTML = '<i class="fa-solid fa-user-plus"></i> Hesap Oluştur';
            }
        }

        async function doRestaurantRegister() {
            const name     = document.getElementById('reg-res-name').value.trim();
            const owner    = document.getElementById('reg-res-owner').value.trim();
            const email    = document.getElementById('reg-res-email').value.trim();
            const phone    = document.getElementById('reg-res-phone').value.trim();
            const category = document.getElementById('reg-res-category').value;
            const pass     = document.getElementById('reg-res-password').value;
            const errEl = document.getElementById('restaurant-error');
            const btn   = document.querySelector('#tab-restaurant .save-btn');
            errEl.style.display = 'none';
            if (!name||!owner||!email||!pass) { errEl.innerText='Restoran adı, yetkili, e-posta ve şifre zorunludur.'; errEl.style.display='block'; return; }
            if (pass.length < 8) { errEl.innerText='Şifre en az 8 karakter olmalıdır.'; errEl.style.display='block'; return; }
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Kayıt alınıyor...';
            try {
                const { auth, db, createUserWithEmailAndPassword, doc, setDoc } = window._fb;
                const cred = await createUserWithEmailAndPassword(auth, email, pass);
                const uid  = cred.user.uid;
                await setDoc(doc(db, 'users', uid), {
                    role: 'restaurant',
                    firstname: name, lastname: '(Restoran)',
                    name, owner, email, phone, category,
                    addresses: [], cards: [], orders: [], orderCount: 0,
                    createdAt: new Date().toISOString(), status: 'pending'
                });
                userProfile = { firstname: name, lastname: '(Restoran)', email, phone, role: 'restaurant' };
                sessionLoaded = true;
                applyProfileToUI();
                alert('Restoran kaydınız başarıyla alındı!');
                document.getElementById('login-screen').style.display = 'none';
            } catch(e) {
                const msgs = {
                    'auth/email-already-in-use':'Bu e-posta zaten kayıtlı.',
                    'auth/invalid-email':'Geçersiz e-posta adresi.',
                    'auth/weak-password':'Şifre çok zayıf.'
                };
                errEl.innerText = msgs[e.code] || ('Kayıt başarısız: ' + e.message);
                errEl.style.display = 'block';
            } finally {
                btn.disabled = false;
                btn.innerHTML = '<i class="fa-solid fa-store"></i> Restoran Olarak Kaydol';
            }
        }

        async function loadUserSession(uid, forceReload = false) {
            if (!forceReload && sessionLoaded && currentUID === uid) return;
            currentUID = uid;
            try {
                const { db, doc, getDoc } = window._fb;
                const snap = await getDoc(doc(db, 'users', uid));
                if (snap.exists()) {
                    const u = snap.data();
                    userProfile     = { firstname:u.firstname||'Kullanıcı', lastname:u.lastname||'', email:u.email||window._fb.auth.currentUser?.email||'', phone:u.phone||'', birthdate:u.birthdate||'', role:u.role||'user', isClosed:u.isClosed||false, menu:u.menu||[] };
                    savedAddresses  = u.addresses  || [];
                    savedCards      = u.cards      || [];
                    orderHistory    = u.orders     || [];
                    totalOrderCount = u.orderCount || 0;
                } else {
                    userProfile = { firstname: 'Kullanıcı', lastname: '', email: window._fb.auth.currentUser?.email || '', role: 'user' };
                }
            } catch(e) { 
                console.warn('Firestore okuma:', e.message); 
                userProfile = { firstname: 'Kullanıcı', lastname: '', email: window._fb.auth.currentUser?.email || '', role: 'user' };
            }
            
            if (window._forceRestaurantUI) {
                userProfile.role = 'restaurant';
            }
            
            sessionLoaded = true;
            applyProfileToUI();
        }

        function applyProfileToUI() {
            if (!userProfile.role && !userProfile.firstname && !userProfile.email) return;
            const fullName = ((userProfile.firstname || '') + ' ' + (userProfile.lastname || '')).trim() || 'Kullanıcı';
            const fInitial = (userProfile.firstname || '')[0] || '';
            const lInitial = (userProfile.lastname || '')[0] || '';
            const initials = (fInitial + lInitial).toUpperCase() || '?';
            
            document.getElementById('profile-display-name').innerText  = fullName;
            document.getElementById('profile-display-email').innerText = userProfile.email;
            document.getElementById('profile-display-phone').innerHTML = userProfile.phone ? '<i class="fa-solid fa-phone"></i> ' + userProfile.phone : '';
            document.getElementById('profile-avatar-display').innerText = initials;
            
            if (userProfile.role === 'restaurant') {
                document.getElementById('customer-main').style.display = 'none';
                if(document.getElementById('restaurant-main')) document.getElementById('restaurant-main').style.display = 'block';
                if(document.getElementById('dash-res-name')) document.getElementById('dash-res-name').innerText = userProfile.firstname;

                document.getElementById('hesabim-btn').innerHTML = `<div class="profile-avatar" id="header-avatar" style="background:var(--warning); color:var(--text-dark);">${initials}</div> Restoran Profili`;
                document.querySelectorAll('.customer-only').forEach(el => el.style.display = 'none');
                document.querySelectorAll('.restaurant-only').forEach(el => el.style.display = 'flex');
                
                const stats = document.querySelectorAll('.profile-stats .stat-card');
                if (stats.length === 3) {
                    stats[0].querySelector('.stat-label').innerText = 'Bekleyen Sipariş';
                    stats[1].querySelector('.stat-label').innerText = 'Değerlendirme';
                    stats[2].querySelector('.stat-label').innerText = 'Aylık Kazanç';
                    stats[2].querySelector('.stat-num').innerText = '₺0';
                }
            } else {
                document.getElementById('customer-main').style.display = 'block';
                if(document.getElementById('restaurant-main')) document.getElementById('restaurant-main').style.display = 'none';

                document.getElementById('hesabim-btn').innerHTML = `<div class="profile-avatar" id="header-avatar">${initials}</div> Hesabım`;
                document.querySelectorAll('.customer-only').forEach(el => el.style.display = 'flex');
                document.querySelectorAll('.restaurant-only').forEach(el => el.style.display = 'none');
                
                const stats = document.querySelectorAll('.profile-stats .stat-card');
                if (stats.length === 3) {
                    stats[0].querySelector('.stat-label').innerText = 'Sipariş';
                    stats[1].querySelector('.stat-label').innerText = 'Puan';
                    stats[2].querySelector('.stat-label').innerText = 'MisKoin';
                    stats[2].querySelector('.stat-num').innerText = '120';
                }
            }

            document.getElementById('edit-firstname').value  = userProfile.firstname || '';
            document.getElementById('edit-lastname').value   = userProfile.lastname || '';
            document.getElementById('edit-email').value      = userProfile.email || '';
            document.getElementById('edit-phone').value      = userProfile.phone || '';
            document.getElementById('edit-birthdate').value  = userProfile.birthdate || '';
            
            document.getElementById('hesabim-btn').style.display = 'flex';
            document.getElementById('login-header-btn').style.display = 'none';
        }

        async function saveCurrentUser() {
            if (!currentUID || !window._fb) return;
            try {
                const { db, doc, setDoc } = window._fb;
                await setDoc(doc(db, 'users', currentUID), {
                    ...userProfile,
                    addresses: savedAddresses,
                    cards: savedCards,
                    orders: orderHistory,
                    orderCount: totalOrderCount,
                    menu: userProfile.menu || [],
                    isClosed: userProfile.isClosed || false,
                    campaign: userProfile.campaign || null
                }, { merge: true });
            } catch(e) { console.warn('Kayıt hatası:', e.message); }
        }

        async function doLogout() {
            await saveCurrentUser();
            await window._fb.signOut(window._fb.auth);
            currentUID = null; sessionLoaded = false;
            userProfile = {}; savedAddresses = []; savedCards = []; orderHistory = []; totalOrderCount = 0;
            closeModals();
            cart = []; updateCartUI();
            document.getElementById('header-avatar').innerText = '?';
            document.getElementById('hesabim-btn').style.display = 'none';
            document.getElementById('login-header-btn').style.display = 'flex';
            
            document.getElementById('customer-main').style.display = 'block';
            if(document.getElementById('restaurant-main')) document.getElementById('restaurant-main').style.display = 'none';
        }

        // Sayfa yüklenince oturum kontrolü
        window.addEventListener('load', () => {
            const waitFb = setInterval(() => {
                if (!window._fb) return;
                clearInterval(waitFb);
                import("https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js").then(m => {
                    m.onAuthStateChanged(window._fb.auth, async (user) => {
                        if (user && !sessionLoaded) {
                            await loadUserSession(user.uid);
                            // Eğer login ekranı açıksa kapat
                            document.getElementById('login-screen').style.display = 'none';
                        }
                    });
                });
            }, 50);
        });

        // SUB PANEL SİSTEMİ

        // HTML onclick'lerden erişim için window'a bağla
        window.doLogin = doLogin;
        window.doResLogin = doResLogin;
        window.doRegister = doRegister;
        window.doRestaurantRegister = doRestaurantRegister;
        window.doLogout = doLogout;
        window.switchLoginTab = switchLoginTab;

        function openSubPanel(name) {
            document.querySelectorAll('.sub-panel').forEach(p => p.classList.remove('active'));
            document.getElementById('profile-' + name).classList.add('active');
            if (name === 'addresses') renderAddresses();
            if (name === 'payment') renderCards();
            if (name === 'orders') renderOrderHistory();
        }

        function saveProfile() {
            const fn = document.getElementById('edit-firstname').value.trim();
            const ln = document.getElementById('edit-lastname').value.trim();
            const email = document.getElementById('edit-email').value.trim();
            const phone = document.getElementById('edit-phone').value.trim();
            if (!fn || !ln || !email) { alert('Ad, soyad ve e-posta zorunludur.'); return; }
            userProfile = { ...userProfile, firstname: fn, lastname: ln, email, phone, birthdate: document.getElementById('edit-birthdate').value };
            applyProfileToUI();
            showToast('Profil güncellendi ✓');
            saveCurrentUser();
            openSubPanel('main');
        }

        function renderAddresses() {
            const list = document.getElementById('address-cards-list');
            if (savedAddresses.length === 0) {
                list.innerHTML = '<p style="color:var(--text-light);text-align:center;padding:20px 0;">Henüz kayıtlı adres yok.</p>';
                return;
            }
            list.innerHTML = savedAddresses.map((a, i) => `
                <div class="saved-card">
                    <div class="saved-card-info">
                        <strong>${a.title}</strong>
                        <span>${a.city}, ${a.district} - ${a.street} ${a.no}</span>
                    </div>
                    <div class="card-actions">
                        <button class="card-del-btn" onclick="deleteAddress(${i})"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>`).join('');
        }

        function saveAddress() {
            const title = document.getElementById('addr-title').value.trim();
            const city = document.getElementById('addr-city').value;
            const district = document.getElementById('addr-district').value.trim();
            const street = document.getElementById('addr-street').value.trim();
            const no = document.getElementById('addr-no').value.trim();
            const desc = document.getElementById('addr-desc').value.trim();
            if (!title || !district || !street) { alert('Başlık, ilçe ve sokak zorunludur.'); return; }
            savedAddresses.push({ title, city, district, street, no, desc });
            ['addr-title','addr-district','addr-street','addr-no','addr-desc'].forEach(id => document.getElementById(id).value = '');
            showToast('Adres kaydedildi ✓');
            saveCurrentUser();
            openSubPanel('addresses');
        }

        function deleteAddress(i) { savedAddresses.splice(i, 1); renderAddresses(); }

        function renderCards() {
            const list = document.getElementById('payment-cards-list');
            if (savedCards.length === 0) {
                list.innerHTML = '<p style="color:var(--text-light);text-align:center;padding:20px 0;">Henüz kayıtlı kart yok.</p>';
                return;
            }
            const icons = { visa: 'fa-cc-visa', mastercard: 'fa-cc-mastercard', troy: 'fa-credit-card' };
            list.innerHTML = savedCards.map((c, i) => `
                <div class="saved-card">
                    <div class="saved-card-info">
                        <strong><i class="fa-brands ${icons[c.type] || 'fa-credit-card'}"></i> **** **** **** ${c.last4}</strong>
                        <span>${c.name} &nbsp;|&nbsp; Son: ${c.exp}</span>
                    </div>
                    <div class="card-actions">
                        <button class="card-del-btn" onclick="deleteCard(${i})"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>`).join('');
        }

        function formatCardNum(input) {
            let v = input.value.replace(/\D/g, '').substring(0, 16);
            input.value = v.replace(/(.{4})/g, '$1 ').trim();
            document.getElementById('card-preview-num').innerText = (input.value || '**** **** **** ****').padEnd(19, '*').replace(/\d(?=.{5})/g, '*') || '**** **** **** ****';
            const display = input.value || '**** **** **** ****';
            document.getElementById('card-preview-num').innerText = display.length < 19 ? display + ' ****'.substring(0, 19 - display.length) : display;
        }

        function formatExpiry(input) {
            let v = input.value.replace(/\D/g, '').substring(0, 4);
            if (v.length >= 3) v = v.substring(0,2) + '/' + v.substring(2);
            input.value = v;
            document.getElementById('card-preview-exp').innerText = input.value || 'MM/YY';
        }

        function updateCardBrand(type) {
            const icons = { visa: 'fa-cc-visa', mastercard: 'fa-cc-mastercard', troy: 'fa-credit-card' };
            const el = document.getElementById('card-preview-brand');
            el.className = 'fa-brands ' + (icons[type] || 'fa-credit-card');
            if (type === 'troy') el.className = 'fa-solid fa-credit-card';
        }

        function saveCard() {
            const name = document.getElementById('card-name').value.trim();
            const num = document.getElementById('card-num-input').value.replace(/\s/g, '');
            const exp = document.getElementById('card-exp').value.trim();
            const cvv = document.getElementById('card-cvv').value.trim();
            const type = document.getElementById('card-type').value;
            if (!name || num.length < 16 || exp.length < 5 || cvv.length < 3) { alert('Lütfen tüm kart bilgilerini eksiksiz girin.'); return; }
            savedCards.push({ name, last4: num.slice(-4), exp, type });
            ['card-name','card-num-input','card-exp','card-cvv'].forEach(id => document.getElementById(id).value = '');
            document.getElementById('card-preview-num').innerText = '**** **** **** ****';
            document.getElementById('card-preview-name').innerText = 'AD SOYAD';
            document.getElementById('card-preview-exp').innerText = 'MM/YY';
            showToast('Kart güvenli şekilde kaydedildi ✓');
            saveCurrentUser();
            openSubPanel('payment');
        }

        function deleteCard(i) { savedCards.splice(i, 1); renderCards(); }

        function renderOrderHistory() {
            const list = document.getElementById('order-history-list');
            if (orderHistory.length === 0) {
                list.innerHTML = '<p style="color:var(--text-light);text-align:center;padding:20px 0;">Henüz tamamlanan sipariş yok.</p>';
                return;
            }
            list.innerHTML = orderHistory.map((o, index) => `
                <div class="saved-card" style="flex-direction:column;align-items:flex-start;gap:6px;">
                    <div style="display:flex;justify-content:space-between;width:100%;">
                        <strong>${o.restaurant}</strong>
                        <span style="color:var(--success);font-weight:700;">${o.total} TL</span>
                    </div>
                    <span style="font-size:13px;color:var(--text-light);">${o.items} &nbsp;|&nbsp; ${o.date}</span>
                    <div style="margin-top: 8px; display: flex; gap: 5px; align-items: center; width: 100%;">
                        ${o.rating ? 
                            Array.from({length: 5}, (_, i) => `<i class="fa-solid fa-star" style="color: ${i < o.rating ? 'var(--warning)' : 'var(--border)'}; font-size: 14px;"></i>`).join('') 
                            : `<span style="font-size:13px; color:var(--text-light); margin-right:5px;">Puanla:</span>
                               <button class="qty-btn" style="font-size:14px; width:auto; padding: 0 4px;" onclick="rateOrder(${index}, 1)">1 <i class="fa-solid fa-star" style="color:var(--warning);"></i></button>
                               <button class="qty-btn" style="font-size:14px; width:auto; padding: 0 4px;" onclick="rateOrder(${index}, 2)">2 <i class="fa-solid fa-star" style="color:var(--warning);"></i></button>
                               <button class="qty-btn" style="font-size:14px; width:auto; padding: 0 4px;" onclick="rateOrder(${index}, 3)">3 <i class="fa-solid fa-star" style="color:var(--warning);"></i></button>
                               <button class="qty-btn" style="font-size:14px; width:auto; padding: 0 4px;" onclick="rateOrder(${index}, 4)">4 <i class="fa-solid fa-star" style="color:var(--warning);"></i></button>
                               <button class="qty-btn" style="font-size:14px; width:auto; padding: 0 4px;" onclick="rateOrder(${index}, 5)">5 <i class="fa-solid fa-star" style="color:var(--warning);"></i></button>`
                        }
                    </div>
                </div>`).join('');
        }

        function rateOrder(index, rating) {
            orderHistory[index].rating = rating;
            saveCurrentUser();
            renderOrderHistory();
            showToast('Değerlendirme kaydedildi ✓');
        }

        function showToast(msg) {
            const t = document.getElementById('success-toast');
            t.innerText = msg; t.style.display = 'block';
            setTimeout(() => t.style.display = 'none', 2500);
        }

        function toggleFaq(el) {
            el.classList.toggle('open');
        }
        function selectAddressOption(element) {
            document.querySelectorAll('.address-item').forEach(el => {
                el.classList.remove('selected');
                const icon = el.querySelector('i');
                if (icon) { icon.className = 'fa-regular fa-circle'; icon.style.color = 'var(--border)'; }
            });
            element.classList.add('selected');
            const icon = element.querySelector('i');
            if (icon) { icon.className = 'fa-solid fa-circle-check'; icon.style.color = 'var(--primary)'; }
        }
        function closeModals() { document.querySelectorAll('.modal-overlay').forEach(m => m.style.display = 'none'); }

        // --- RESTAURANT FUNCTIONS ---
        function toggleStoreStatus() {
            userProfile.isClosed = !userProfile.isClosed;
            saveCurrentUser();
            applyProfileToUI();
            showToast(userProfile.isClosed ? 'Dükkan geçici olarak kapatıldı.' : 'Dükkan siparişlere açıldı.');
        }

        function openResMenuManager() {
            closeModals();
            if (!userProfile.menu) userProfile.menu = [];
            renderResMenu();
            document.getElementById('res-manage-menu-modal').style.display = 'flex';
        }

        function renderResMenu() {
            const list = document.getElementById('res-menu-list');
            if (!userProfile.menu || userProfile.menu.length === 0) {
                list.innerHTML = '<p style="text-align:center; color:var(--text-light); padding:20px;">Menünüzde henüz ürün yok.</p>';
                return;
            }
            list.innerHTML = userProfile.menu.map((item, index) => `
                <div style="display:flex; justify-content:space-between; align-items:center; border:1px solid var(--border); border-radius:12px; padding:15px; background:white;">
                    <div style="display:flex; gap:15px; align-items:center;">
                        ${item.img ? `<img src="${item.img}" style="width:50px; height:50px; border-radius:8px; object-fit:cover;">` : `<div style="width:50px; height:50px; background:var(--bg-color); border-radius:8px; display:flex; align-items:center; justify-content:center;"><i class="fa-solid fa-utensils" style="color:var(--text-light)"></i></div>`}
                        <div>
                            <div style="font-weight:bold;">${item.name}</div>
                            <div style="font-size:13px; color:var(--text-light);">${item.desc}</div>
                            <div style="font-weight:900; color:var(--primary); margin-top:5px;">₺${item.price}</div>
                        </div>
                    </div>
                    <button onclick="deleteResMenuItem(${index})" style="background:none; border:none; color:#ef4444; cursor:pointer; font-size:18px; padding:10px;"><i class="fa-solid fa-trash"></i></button>
                </div>
            `).join('');
        }

        function addResMenuItem() {
            const name = document.getElementById('res-new-item-name').value.trim();
            const desc = document.getElementById('res-new-item-desc').value.trim();
            const price = parseFloat(document.getElementById('res-new-item-price').value);
            const img = document.getElementById('res-new-item-img').value.trim();

            if (!name || isNaN(price)) {
                alert('Ürün adı ve geçerli bir fiyat girmelisiniz.');
                return;
            }

            if (!userProfile.menu) userProfile.menu = [];
            userProfile.menu.push({ id: Date.now(), name, desc, price, img });
            
            saveCurrentUser();
            renderResMenu();
            
            document.getElementById('res-new-item-name').value = '';
            document.getElementById('res-new-item-desc').value = '';
            document.getElementById('res-new-item-price').value = '';
            document.getElementById('res-new-item-img').value = '';
            
            showToast('Ürün eklendi!');
        }

        function deleteResMenuItem(index) {
            if(confirm('Bu ürünü silmek istediğinize emin misiniz?')) {
                userProfile.menu.splice(index, 1);
                saveCurrentUser();
                renderResMenu();
                showToast('Ürün silindi.');
            }
        }

        function openCampaignManager() {
            closeModals();
            const ct = document.getElementById('current-campaign-text');
            const btn = document.getElementById('btn-cancel-campaign');
            if (userProfile.campaign && userProfile.campaign.active) {
                let txt = '';
                if (userProfile.campaign.type === 'discount_percentage') txt = `Tüm Menüde %${userProfile.campaign.value} İndirim`;
                else if (userProfile.campaign.type === 'discount_amount') txt = `Sepette ₺${userProfile.campaign.value} İndirim`;
                else txt = 'Ücretsiz Teslimat';
                ct.innerText = `Aktif Kampanya: ${txt}`;
                ct.style.color = 'var(--success)';
                ct.style.fontWeight = 'bold';
                btn.style.display = 'inline-block';
            } else {
                ct.innerText = 'Şu an aktif bir kampanyanız bulunmuyor.';
                ct.style.color = 'var(--text-light)';
                ct.style.fontWeight = 'normal';
                btn.style.display = 'none';
            }
            document.getElementById('res-campaign-modal').style.display = 'flex';
        }

        function saveCampaign() {
            const type = document.getElementById('campaign-type').value;
            const value = document.getElementById('campaign-value').value;
            if (type !== 'free_delivery' && (!value || isNaN(value) || value <= 0)) {
                alert('Geçerli bir indirim miktarı giriniz.');
                return;
            }
            userProfile.campaign = { active: true, type, value: parseFloat(value) || 0 };
            saveCurrentUser();
            showToast('Kampanya başarıyla başlatıldı!');
            openCampaignManager();
        }

        function cancelCampaign() {
            if(confirm('Mevcut kampanyayı bitirmek istediğinize emin misiniz?')) {
                userProfile.campaign = { active: false };
                saveCurrentUser();
                showToast('Kampanya sona erdi.');
                openCampaignManager();
            }
        }

        function openResReports() {
            closeModals();
            // Basit raporlama (Gerçekte orderHistory üzerinden hesaplanmalı)
            let totalErn = 0;
            let totalOrd = userProfile.orderCount || 0;
            // Varsayımsal hesaplama (Demolarda dolu görünmesi için)
            if (userProfile.orders && userProfile.orders.length > 0) {
                totalErn = userProfile.orders.reduce((sum, o) => sum + (o.total || 0), 0);
                totalOrd = userProfile.orders.length;
            }
            document.getElementById('report-total-earned').innerText = `₺${totalErn}`;
            document.getElementById('report-total-orders').innerText = totalOrd;
            document.getElementById('res-reports-modal').style.display = 'flex';
        }
        // -----------------------------
        function openTrackingModal() { closeModals(); document.getElementById('tracking-modal').style.display = 'flex'; }

        function startOrderSimulation() {
            if(!activeRestaurant) return; 
            closeModals();
            document.getElementById('tracking-modal').style.display = 'flex';
            document.getElementById('track-order-btn').style.display = 'flex'; 
            document.getElementById('eta-box').style.display = 'none';
            document.getElementById('order-status-text').innerHTML = 'Sipariş Hazırlanıyor... <i class="fa-solid fa-spinner fa-spin"></i>';
            document.getElementById('time-text').innerText = 'Restoran siparişi onayladı, kurye atanıyor...';
            setTimeout(() => { if (!mapInitialized) { initMapAndRoute(); mapInitialized = true; } else { startCourierJourney(); } }, 500);
        }

        function initMapAndRoute() {
            map = L.map('map-container').setView([userLat, userLng], 14);
            L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { attribution: '&copy; OpenStreetMap &copy; CARTO', subdomains: 'abcd', maxZoom: 19 }).addTo(map);
            const userIcon = L.icon({ iconUrl: 'https://cdn-icons-png.flaticon.com/512/25/25694.png', iconSize: [35, 35], iconAnchor: [17, 35] });
            const bikeIcon = L.icon({ iconUrl: 'https://cdn-icons-png.flaticon.com/512/2972/2972185.png', iconSize: [45, 45], iconAnchor: [22, 45] });
            L.marker([userLat, userLng], {icon: userIcon}).addTo(map).bindPopup("Teslimat Adresiniz").openPopup();
            kuryeMarker = L.marker([activeRestaurant.lat, activeRestaurant.lng], {icon: bikeIcon}).addTo(map);

            routeControl = L.Routing.control({
                waypoints: [ L.latLng(activeRestaurant.lat, activeRestaurant.lng), L.latLng(userLat, userLng) ],
                createMarker: function() { return null; }, addWaypoints: false, routeWhileDragging: false, fitSelectedRoutes: true, show: false,
                lineOptions: { styles: [{color: '#ea004b', opacity: 0.8, weight: 6}] }
            }).addTo(map);

            routeControl.on('routesfound', function(e) {
                var pathCoords = e.routes[0].coordinates;
                var totalTimeSeconds = e.routes[0].summary.totalTime;
                var estimatedMinutes = Math.round(totalTimeSeconds / 60) + 15;
                document.getElementById('eta-box').style.display = 'flex';
                document.getElementById('dynamic-eta').innerText = estimatedMinutes + " Dakika";
                startCourierAnimation(pathCoords);
            });
        }

        function startCourierAnimation(pathCoords) {
            document.getElementById('order-status-text').innerHTML = "Kurye Yolda! <i class='fa-solid fa-motorcycle'></i>";
            document.getElementById('time-text').innerHTML = `Siparişin <strong>${activeRestaurant.name}</strong> adlı restorandan geliyor!`;
            let i = 0; if(animasyonInterval) clearInterval(animasyonInterval);
            animasyonInterval = setInterval(() => {
                if (i < pathCoords.length) {
                    kuryeMarker.setLatLng([pathCoords[i].lat, pathCoords[i].lng]);
                    if(i % 5 === 0) map.panTo([pathCoords[i].lat, pathCoords[i].lng]);
                    i++;
                } else {
                    clearInterval(animasyonInterval);
                    document.getElementById('order-status-text').innerHTML = "Sipariş Teslim Edildi! <i class='fa-solid fa-check-circle' style='color:var(--success);'></i>";
                    document.getElementById('time-text').innerHTML = "Afiyet olsun! MisYemek'i tercih ettiğiniz için teşekkürler.";
                    document.getElementById('eta-box').style.display = 'none';
                    kuryeMarker.bindPopup("Sipariş ulaştı!").openPopup();
                    document.getElementById('track-order-btn').style.display = 'none'; 
                    totalOrderCount++;
                    const orderTotal = cart.reduce((s,i) => s + i.price * i.qty, 0);
                    const orderItems = cart.map(i => i.name).join(', ');
                    orderHistory.unshift({ restaurant: activeRestaurant.name, total: orderTotal, items: orderItems, date: new Date().toLocaleDateString('tr-TR') });
                    cart = []; updateCartUI();
                    saveCurrentUser();
                }
            }, 80); 
        }

        // Tüm global fonksiyonları window'a bağla (type="module" scope sorunu için)
        Object.assign(window, {
            filterCategory, openMenu, addToCart, changeQty, openCart, openAddressSelection,
            renderDeliveryAddresses, selectAddressOption, openProfile, openSubPanel,
            saveProfile, renderAddresses, saveAddress, deleteAddress,
            renderCards, saveCard, deleteCard, formatCardNum, formatExpiry, updateCardBrand,
            renderOrderHistory, showToast, toggleFaq, closeModals, openTrackingModal,
            startOrderSimulation, showLoginRequired, rateOrder
        });
    