document.addEventListener('DOMContentLoaded', () => {
    const checkFB = setInterval(() => {
        if (window._fb) {
            clearInterval(checkFB);
            initAdminRealtime();
        }
    }, 100);

    function initAdminRealtime() {
        const { db, collection, query, onSnapshot, where, orderBy, limit } = window._fb;

        // 1. KULLANICI SAYISI
        onSnapshot(collection(db, "users"), (snapshot) => {
            let userCount = 0;
            let resCount = 0;
            const resList = document.getElementById('admin-restaurants-list');
            if (resList) resList.innerHTML = '';

            snapshot.forEach(doc => {
                const data = doc.data();
                if (data.role === 'restaurant') {
                    resCount++;
                    if (resList) {
                        const tr = document.createElement('tr');
                        tr.innerHTML = `
                            <td><div class="avatar" style="width:35px; height:35px; font-size:12px;">${data.name.substring(0,1)}</div></td>
                            <td style="font-weight:700;">${data.name}</td>
                            <td>${data.owner || '-'}</td>
                            <td><span class="status-badge" style="background:var(--bg-light); color:var(--text-dark);">${data.category}</span></td>
                            <td>${data.email}</td>
                            <td><span class="status-badge success">Aktif</span></td>
                            <td><button class="action-btn" title="Düzenle"><i class="fa-solid fa-pen-to-square"></i></button></td>
                        `;
                        resList.appendChild(tr);
                    }
                } else {
                    userCount++;
                }
            });
            if(document.getElementById('stat-total-users')) document.getElementById('stat-total-users').innerText = userCount;
            if(document.getElementById('stat-total-restaurants')) document.getElementById('stat-total-restaurants').innerText = resCount;
        }, (error) => {
            if(error.code === 'permission-denied') {
                console.warn("Permission denied for users collection. Check Firestore Rules.");
            }
        });

        // 2. SİPARİŞLER VE SATIŞLAR (Hata yakalayıcı eklendi)
        onSnapshot(collection(db, "orders"), (snapshot) => {
            let activeCount = 0;
            let totalSales = 0;
            const list = document.getElementById('recent-orders-list');
            if(!list) return;
            
            list.innerHTML = '';
            const orders = [];
            
            snapshot.forEach(doc => {
                const data = doc.data();
                data.id = doc.id;
                orders.push(data);
                if (data.status !== 'completed' && data.status !== 'cancelled') {
                    activeCount++;
                }
                totalSales += (data.total || 0);
            });

            // Güvenli Sıralama: createdAt null ise en yeni kabul et (anlık düşen siparişler için)
            orders.sort((a,b) => {
                const timeA = a.createdAt?.seconds || Date.now() / 1000;
                const timeB = b.createdAt?.seconds || Date.now() / 1000;
                return timeB - timeA;
            });

            if (orders.length === 0) {
                list.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:2rem; opacity:0.5;">Henüz sipariş bulunmuyor.</td></tr>';
            }

            orders.slice(0, 10).forEach(order => {
                const tr = document.createElement('tr');
                const statusClass = order.status === 'completed' ? 'completed' : 'pending';
                const statusText = order.status === 'completed' ? 'Teslim Edildi' : (order.status === 'preparing' ? 'Hazırlanıyor' : (order.status === 'shipped' ? 'Kuryede' : order.status));
                
                tr.innerHTML = `
                    <td>#${order.id.substring(0, 5).toUpperCase()}</td>
                    <td>${order.customerName || 'Müşteri'}</td>
                    <td>${order.restaurantName || 'Restoran'}</td>
                    <td>₺${(order.total || 0).toLocaleString('tr-TR')}</td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                    <td style="display:flex; gap:5px;">
                        <button class="action-btn" onclick="updateOrderStatus('${order.id}', 'shipped')" title="Kuryeyi Yola Çıkar"><i class="fa-solid fa-motorcycle"></i></button>
                        <button class="action-btn" onclick="updateOrderStatus('${order.id}', 'completed')" title="Teslim Edildi"><i class="fa-solid fa-check"></i></button>
                        <button class="action-btn" onclick="viewOrder('${order.id}')" title="Detay"><i class="fa-solid fa-eye"></i></button>
                    </td>
                `;
                list.appendChild(tr);
            });

            if(document.getElementById('stat-active-orders')) document.getElementById('stat-active-orders').innerText = activeCount;
            if(document.getElementById('stat-total-sales')) document.getElementById('stat-total-sales').innerText = '₺' + totalSales.toLocaleString('tr-TR');
        }, (error) => {
            console.error("Firebase Veri Hatası:", error);
            if(error.code === 'permission-denied') {
                alert("YETKİ HATASI: Firebase Console üzerinden 'Rules' (Kurallar) kısmını güncellemeniz gerekiyor. Erişim engellendi.");
            }
        });
    }

    // Sidebar Nav & Tab Switching
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            const tabId = link.getAttribute('data-tab');
            if (tabId) {
                e.preventDefault();
                
                // Aktif linki güncelle
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                
                // Panelleri değiştir
                document.querySelectorAll('.admin-panel-tab').forEach(tab => {
                    tab.style.display = 'none';
                });
                const targetPanel = document.getElementById('panel-' + tabId);
                if (targetPanel) targetPanel.style.display = 'block';
                
                // Başlığı güncelle
                const pageTitle = link.querySelector('span').innerText;
                document.querySelector('.page-title h1').innerText = pageTitle;
            }
        });
    });
});

window.updateOrderStatus = async (id, status) => {
    try {
        const { db, doc, updateDoc } = window._fb;
        await updateDoc(doc(db, "orders", id), { status: status });
    } catch (err) {
        alert("Güncelleme Hatası: " + err.message);
    }
};

window.viewOrder = (id) => alert('Sipariş Detayı: ' + id);

window.showAddResModal = () => document.getElementById('add-res-modal').style.display = 'flex';
window.hideAddResModal = () => document.getElementById('add-res-modal').style.display = 'none';

document.getElementById('add-res-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    
    const name = document.getElementById('admin-res-name').value;
    const owner = document.getElementById('admin-res-owner').value;
    const email = document.getElementById('admin-res-email').value;
    const cat = document.getElementById('admin-res-cat').value;

    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Kaydediliyor...';

    try {
        const { db, addDoc, collection, serverTimestamp } = window._fb;
        await addDoc(collection(db, "users"), {
            role: 'restaurant',
            name: name,
            owner: owner,
            email: email,
            category: cat,
            status: 'active',
            createdAt: serverTimestamp()
        });
        alert('Restoran başarıyla eklendi!');
        hideAddResModal();
        e.target.reset();
    } catch (err) {
        alert('Hata: ' + err.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
});

    // Mobile Sidebar Toggle
    const menuBtn = document.getElementById('mobile-menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('sidebar-overlay');

    if (menuBtn && sidebar && overlay) {
        menuBtn.addEventListener('click', () => {
            sidebar.classList.add('open');
            overlay.classList.add('active');
        });

        overlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
        });

        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    sidebar.classList.remove('open');
                    overlay.classList.remove('active');
                }
            });
        });
    }
