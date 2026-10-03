const R = 'http://localhost:8001';
const M = 'http://localhost:8002';
const O = 'http://localhost:8003';

let restaurantsData = [];
let menuData = [];


/* SHOW SECTION */

function show(id) {

  document.querySelectorAll('section')
    .forEach(s => s.classList.add('hide'));

  document.getElementById(id)
    .classList.remove('hide');

  if (id === 'cart') loadCart();
  if (id === 'wishlist') loadWish();
  if (id === 'orders') orders();
  if (id === 'restaurantManage') restaurants();
  if (id === 'menuManage') menuManage();
}


/* GET */

async function get(url) {

  let r = await fetch(url);
  let d = await r.json();

  if (!r.ok) throw Error(d.error);

  return d;
}


/* SEND */

async function send(url, options) {

  let r = await fetch(url, options);
  let d = await r.json();

  if (!r.ok) throw Error(d.error);

  return d;
}


/* RESTAURANTS */

async function loadRestaurants() {

  restaurantsData = await get(R + '/restaurants');

  restaurantList.innerHTML =
    restaurantsData.map(r => `

      <div class="card">

        <b>${r.name}</b><br>
        ${r.location}<br>
        ${r.phone || ''}<br>

        <button onclick="selectRestaurant(${r.id})">
          View Menu
        </button>

      </div>

    `).join('');

  restaurantSelect.innerHTML =
    '<option value="">Select Restaurant</option>' +

    restaurantsData.map(r =>
      `<option value="${r.id}">${r.name}</option>`
    ).join('');
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

      </div>

    `;

  }).join('') || '<p>Cart empty</p>';

  total.innerHTML =
    c.length ? `Total: ₹${totalAmount}` : '';
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

      </div>

    `;

  }).join('') || '<p>Wishlist empty</p>';
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

  let restaurantId =
    Number(restaurantSelect.value) || 1;

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

  alert(
    'Payment successful! Order placed.'
  );

  show('orders');

  orders();
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


/* START */

loadRestaurants();
loadWish();
loadCart();
orders();