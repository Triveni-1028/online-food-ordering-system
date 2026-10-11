const R = '/api/restaurant';
const M = '/api/menu';
const O = '/api/order';

let restaurantsData = [];
let menuData = [];


/* SHOW SECTION */

function show(id) {

  document.querySelectorAll('section')
    .forEach(s => s.classList.add('hide'));

  document.getElementById(id)
    .classList.remove('hide');

  if (id === 'restaurants') loadRestaurants();
  if (id === 'menu') loadRestaurants();
  if (id === 'cart') loadCart();
  if (id === 'wishlist') loadWish();
  if (id === 'orders') orders();
  if (id === 'restaurantManage') restaurants();
  if (id === 'menuManage') menuManage();
}


/* GET */

async function get(url) {
  const r = await fetch(url, { headers: { Accept: 'application/json' } });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || `Request failed (${r.status})`);
  return d;
}


/* SEND */

async function send(url, options = {}) {
  const r = await fetch(url, options);
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || `Request failed (${r.status})`);
  return d;
}


/* RESTAURANTS */

async function loadRestaurants() {
  restaurantsData = await get(R + '/restaurants');
  restaurantSelect.innerHTML = '<option value="">Select Restaurant</option>' +
    restaurantsData.map(r => `<option value="${r.id}">${escapeHtml(r.name)}</option>`).join('');
  await renderRestaurantMenu();
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}

async function renderRestaurantMenu() {
  const list = document.getElementById('restaurantList');
  if (!list) return;
  const query = (document.getElementById('restaurantSearch')?.value || '').trim();
  try {
    // This endpoint is handled by Menu Service, which calls Restaurant Service.
    const groups = await get(M + '/by-restaurant-name?name=' + encodeURIComponent(query));
    list.innerHTML = groups.map(group => `
      <div class="card restaurant-menu-card">
        <b>${escapeHtml(group.restaurant.name)}</b><br>
        <small>${escapeHtml(group.restaurant.location || '')} · ${escapeHtml(group.restaurant.phone || '')}</small>
        <div class="menu-grid">
          ${(group.items || []).map(item => `
            <div class="card dish-card">
              <b>${escapeHtml(item.name)}</b><br>
              <strong>₹${Number(item.price).toFixed(0)}</strong><br>
              <small>${item.availability ? 'Available' : 'Unavailable'}</small><br>
              ${item.availability ? `<button onclick="cart(${Number(item.id)})">Add to Cart</button> <button class="sparkle" onclick="wish(${Number(item.id)})">♡ Wishlist</button>` : ''}
            </div>`).join('') || '<p>No dishes listed for this restaurant.</p>'}
        </div>
      </div>`).join('') || '<p>No restaurants match your search.</p>';
  } catch (err) {
    list.innerHTML = `<p>Could not load menus: ${escapeHtml(err.message)}</p>`;
  }
}

/* SELECT RESTAURANT */

function selectRestaurant(id) {

  restaurantSelect.value = id;

  show('menu');

  loadMenu();
}


/* RESTAURANT MANAGEMENT */

rf.onsubmit = async e => {

  e.preventDefault();

  await send(R + '/restaurants', {

    method: 'POST',

    headers: {
      'Content-Type': 'application/json'
    },

    body: JSON.stringify({
      name: rn.value,
      location: rl.value,
      phone: rp.value
    })

  });

  e.target.reset();

  loadRestaurants();
  restaurants();

};


async function restaurants() {

  let d = await get(R + '/restaurants');

  rls.innerHTML = d.map(x => `

    <div class="card">

      <b>#${x.id} ${x.name}</b><br>
      ${x.location}<br>
      ${x.phone || ''}<br>

      <button onclick="editR(${x.id},'${x.name}','${x.location}','${x.phone || ''}')">
        Update
      </button>

      <button onclick="delR(${x.id})">
        Delete
      </button>

    </div>

  `).join('');
}


async function delR(id) {

  await send(R + '/restaurants/' + id, {
    method: 'DELETE'
  });

  loadRestaurants();
  restaurants();
}


async function editR(id, name, location, phone) {

  let n = prompt('Name', name);
  let l = prompt('Location', location);
  let p = prompt('Phone', phone);

  if (!n) return;

  await send(R + '/restaurants/' + id, {

    method: 'PUT',

    headers: {
      'Content-Type': 'application/json'
    },

    body: JSON.stringify({
      name: n,
      location: l,
      phone: p
    })

  });

  loadRestaurants();
  restaurants();
}


/* MENU */

async function loadMenu() {

  let id = Number(restaurantSelect.value);

  if (!id) {

    mls.innerHTML =
      '<p>Please select a restaurant.</p>';

    return;
  }

  menuData = await get(M + '/menu');

  let data = menuData.filter(
    x => Number(x.restaurantId) === id
  );

  mls.innerHTML = data.map(x => `

    <div class="card">

      <b>${x.name}</b>

      <br>

      ₹${x.price}

      <br>

      ${x.availability ? 'Available' : 'Unavailable'}

      <br>

      ${
        x.availability
        ? `
          <button onclick="cart(${x.id})">
            Add to Cart
          </button>

          <button class="sparkle"
                  onclick="wish(${x.id})">
            ✨
          </button>
        `
        : ''
      }

    </div>

  `).join('') || '<p>No food available.</p>';
}


/* ADD FOOD */

mf.onsubmit = async e => {

  e.preventDefault();

  await send(M + '/menu', {

    method: 'POST',

    headers: {
      'Content-Type': 'application/json'
    },

    body: JSON.stringify({

      name: mn.value,

      restaurantId: +mr.value,

      price: +mp.value,

      availability: ma.checked

    })

  });

  e.target.reset();

  ma.checked = true;

  menuManage();

};


async function menuManage() {

  let d = await get(M + '/menu');

  manageMenuList.innerHTML = d.map(x => `

    <div class="card">

      <b>${x.name}</b> -
      ₹${x.price}

      <br>

      Restaurant ID: ${x.restaurantId}

      <br>

      <button onclick="editM(${x.id},${x.price})">
        Update Price
      </button>

      <button onclick="delM(${x.id})">
        Delete
      </button>

    </div>

  `).join('');
}


async function editM(id, price) {

  let p = prompt('Price', price);

  if (p === null) return;

  await send(M + '/menu/' + id, {

    method: 'PUT',

    headers: {
      'Content-Type': 'application/json'
    },

    body: JSON.stringify({
      price: +p,
      availability: confirm('Available?')
    })

  });

  menuManage();
}


async function delM(id) {

  await send(M + '/menu/' + id, {
    method: 'DELETE'
  });

  menuManage();
}


/* CART */

async function cart(id) {

  await send(M + '/cart', {

    method: 'POST',

    headers: {
      'Content-Type': 'application/json'
    },

    body: JSON.stringify({
      menuItemId: id,
      quantity: 1
    })

  });

  alert('Added to cart');

  loadCart();
}


async function loadCart() {

  let c = await get(M + '/cart');
  let m = await get(M + '/menu');

  let totalAmount = 0;

  cls.innerHTML = c.map(x => {

    let food = m.find(
      f => Number(f.id) === Number(x.menuItemId)
    );

    if (!food) return '';

    let amount =
      Number(food.price) * Number(x.quantity);

    totalAmount += amount;

    return `

      <div class="card">

        ${food.name}
        × ${x.quantity}

        — ₹${amount}

        <br>
        <button class="cancel" onclick="removeCartItem(${Number(x.menuItemId)})">Remove</button>

      </div>

    `;

  }).join('') || '<p>Cart empty</p>';

  total.innerHTML =
    c.length ? `Total: ₹${totalAmount}` : '';
}

async function removeCartItem(id) {
  try {
    await send(M + '/cart/' + encodeURIComponent(id), { method: 'DELETE' });
    await loadCart();
  } catch (err) {
    alert('Could not remove item from cart: ' + err.message);
  }
}


/* WISHLIST */

async function wish(id) {

  await send(M + '/wishlist', {

    method: 'POST',

    headers: {
      'Content-Type': 'application/json'
    },

    body: JSON.stringify({
      menuItemId: id
    })

  });

  alert('Added to Wishlist');

  loadWish();
}


async function loadWish() {

  let w = await get(M + '/wishlist');
  let m = await get(M + '/menu');

  wls.innerHTML = w.map(id => {

    let food = m.find(
      f => Number(f.id) === Number(id)
    );

    if (!food) return '';

    return `

      <div class="card">

        ✨ <b>${food.name}</b>
        — ₹${food.price}

        <br>

        <button onclick="cart(${food.id})">
          Add to Cart
        </button>
        <button class="cancel" onclick="removeWishItem(${Number(food.id)})">Remove</button>

      </div>

    `;

  }).join('') || '<p>Wishlist empty</p>';
}

async function removeWishItem(id) {
  try {
    await send(M + '/wishlist/' + encodeURIComponent(id), { method: 'DELETE' });
    await loadWish();
  } catch (err) {
    alert('Could not remove item from wishlist: ' + err.message);
  }
}


/* PAYMENT */

async function payment() {

  let c = await get(M + '/cart');

  if (!c.length) {

    alert('Cart is empty');

    return;
  }

  let m = await get(M + '/menu');

  let totalAmount = 0;

  c.forEach(x => {

    let food = m.find(
      f => Number(f.id) === Number(x.menuItemId)
    );

    if (food) {

      totalAmount +=
        Number(food.price) * Number(x.quantity);

    }

  });

  paymentDetails.innerHTML = `

    <div class="card">

      <b>Total Amount: ₹${totalAmount}</b>

      <p>Payment is simulated for this project.</p>

    </div>

  `;

  show('payment');
}


/* PAY */

async function pay() {

  let c = await get(M + '/cart');

  let m = await get(M + '/menu');

  let totalAmount = 0;

  c.forEach(x => {

    let food = m.find(
      f => Number(f.id) === Number(x.menuItemId)
    );

    if (food) {

      totalAmount +=
        Number(food.price) * Number(x.quantity);

    }

  });

  if (!c.length) {
    alert('Your cart is empty. Add food before placing an order.');
    return;
  }

  // Determine the restaurant from the actual food items in the cart.
  // Do not silently assign restaurant ID 1 when another restaurant was selected.
  const cartFoods = c.map(item =>
    m.find(food => Number(food.id) === Number(item.menuItemId))
  );

  if (cartFoods.some(food => !food)) {
    alert('Some cart items are no longer available in the menu. Please review your cart.');
    return;
  }

  const restaurantIds = [...new Set(
    cartFoods.map(food => Number(food.restaurantId))
  )];

  if (restaurantIds.length !== 1 || !restaurantIds[0]) {
    alert('Please order from one restaurant at a time. Remove items from other restaurants and try again.');
    return;
  }

  const restaurantId = restaurantIds[0];

  try {
    await send(O + '/orders', {

    method: 'POST',

    headers: {
      'Content-Type': 'application/json'
    },

    body: JSON.stringify({

      customerName: 'Demo Customer',

      restaurantId: restaurantId,

      items: c,

      totalAmount: totalAmount,

      address: 'Demo Address',

      deliveryPersonName: 'Rahul Patil',

      deliveryPersonPhone: '9876543210'

    })

    });

    alert('Demo payment successful! Your order has been placed.');
    show('orders');
    await orders();
  } catch (error) {
    alert('Could not place the order: ' + (error.message || 'Please try again.'));
    console.error('Order placement failed:', error);
  }
}


/* ORDERS */

async function orders() {

  let d = await get(O + '/orders');

  ols.innerHTML = d.map(x => {

    let minutes =
      (Date.now() -
      new Date(x.createdAt).getTime()) /
      60000;

    let canCancel =
      minutes <= 20 &&
      !['Out for Delivery',
        'Delivered',
        'Cancelled'].includes(x.status);

    return `

      <div class="card">

        <b>Order #${x.id}</b>

        <br>

        Status: ${x.status}

        <br>

        Total: ₹${x.totalAmount}

        <br>

        ${canCancel
          ? `
            <button class="cancel"
                    onclick="cancel(${x.id})">
              Cancel Order
            </button>
            <small>
              Cancel within 20 minutes
            </small>
          `
          : `
            <small>
              Cancellation window expired
            </small>
          `
        }

      </div>

    `;

  }).join('') || '<p>No orders</p>';
}


/* CANCEL ORDER */

async function cancel(id) {

  try {

    await send(O + '/orders/' + id, {
      method: 'DELETE'
    });

    alert('Order cancelled');

    orders();

  } catch (e) {

    alert(e.message);

  }
}


/* FRIENDLY ERROR HANDLING */
// Show a useful alert if an async UI action fails unexpectedly (for example,
// if a service is stopped or an API returns an error). Details remain in DevTools.
window.addEventListener('unhandledrejection', event => {
  const reason = event.reason;
  const message = reason && reason.message
    ? reason.message
    : 'A request failed. Please check that the backend services are running and try again.';

  event.preventDefault();
  console.error('Frontend action failed:', reason);
  alert('Something went wrong: ' + message);
});


/* START */

loadRestaurants();
loadWish();
loadCart();
orders();