const R='http://localhost:8001',M='http://localhost:8002',O='http://localhost:8003';
const get=u=>fetch(u).then(r=>r.json());
const send=(u,o)=>fetch(u,o).then(async r=>{
  let d=await r.json();
  if(!r.ok)throw Error(d.error);
  return d
});
function show(x){
  document.querySelectorAll('section').forEach(s=>s.classList.add('hide'));
  document.getElementById(x).classList.remove('hide')
}
async function restaurants(){
  let d=await get(R+'/restaurants');
  rls.innerHTML=d.map(x=>`<div class="card"><b>#${x.id} ${x.name}</b> — ${x.location} — ${x.phone}<br>${x.status}<br><button onclick="editR(${x.id},'${x.name}','${x.location}','${x.phone}')">Update</button><button onclick="delR(${x.id})">Delete</button></div>`).join('')
}
rf.onsubmit=async e=>{
  e.preventDefault();
  await send(R+'/restaurants',{
    method:'POST',headers:{
      'Content-Type':'application/json'
    },body:JSON.stringify({
      name:rn.value,location:rl.value,phone:rp.value
    })
  });
  e.target.reset();
  restaurants()
};
async function delR(id){
  await send(R+'/restaurants/'+id,{
    method:'DELETE'
  });
  restaurants()
}
async function editR(id,n,l,p){
  let name=prompt('Name',n),location=prompt('Location',l),phone=prompt('Phone',p);
  if(name)await send(R+'/restaurants/'+id,{
    method:'PUT',headers:{
      'Content-Type':'application/json'
    },body:JSON.stringify({
      name,location,phone
    })
  });
  restaurants()
}
async function menu(){
  let d=await get(M+'/menu');
  mls.innerHTML=d.map(x=>`<div class="card"><b>#${x.id} ${x.name}</b> — ₹${x.price} — ${x.availability?'Available':'Unavailable'}<br><button onclick="cart(${x.id})">Add to Cart</button><button onclick="wish(${x.id})">Wishlist</button><button onclick="editM(${x.id},${x.price})">Update Price</button><button onclick="delM(${x.id})">Delete</button></div>`).join('')
}
mf.onsubmit=async e=>{
  e.preventDefault();
  await send(M+'/menu',{
    method:'POST',headers:{
      'Content-Type':'application/json'
    },body:JSON.stringify({
      name:mn.value,restaurantId:+mr.value,price:+mp.value,availability:ma.checked
    })
  });
  e.target.reset();
  ma.checked=true;
  menu()
};
async function editM(id,p){
  let price=prompt('Price',p);
  if(price!==null)await send(M+'/menu/'+id,{
    method:'PUT',headers:{
      'Content-Type':'application/json'
    },body:JSON.stringify({
      price:+price,availability:confirm('Available?')
    })
  });
  menu()
}
async function delM(id){
  await send(M+'/menu/'+id,{
    method:'DELETE'
  });
  menu()
}
async function cart(id){
  await send(M+'/cart',{
    method:'POST',headers:{
      'Content-Type':'application/json'
    },body:JSON.stringify({
      menuItemId:id,quantity:1
    })
  });
  loadCart();
  alert('Added to cart')
}
async function loadCart(){
  let d=await get(M+'/cart');
  cls.innerHTML=d.map(x=>`<div class="card">Food #${x.menuItemId} — Qty ${x.quantity}</div>`).join('')||'<p>Cart empty</p>'
}
async function wish(id){
  await send(M+'/wishlist',{
    method:'POST',headers:{
      'Content-Type':'application/json'
    },body:JSON.stringify({
      menuItemId:id
    })
  });
  loadWish()
}
async function loadWish(){
  let d=await get(M+'/wishlist');
  wls.innerHTML=d.map(x=>`<div class="card">Food #${x}</div>`).join('')||'<p>Wishlist empty</p>'
}
async function orders(){
  let d=await get(O+'/orders');
  ols.innerHTML=d.map(x=>`<div class="card"><b>Order #${x.id}</b> — ${x.status}<br>Delivery: ${x.deliveryPersonName} — ${x.deliveryPersonPhone}<br><button onclick="status(${x.id})">Update Status</button><button onclick="cancel(${x.id})">Cancel</button></div>`).join('')||'<p>No orders</p>'
}
async function placeOrder(){
  let c=await get(M+'/cart');
  if(!c.length)return alert('Add food first');
  await send(O+'/orders',{
    method:'POST',headers:{
      'Content-Type':'application/json'
    },body:JSON.stringify({
      customerName:'Demo Customer',restaurantId:1,items:c,totalAmount:0,address:'Demo Address',deliveryPersonName:'Rahul Patil',deliveryPersonPhone:'9876543210'
    })
  });
  orders();
  alert('Order placed. Cancel within 20 minutes.')
}
async function status(id){
  let s=prompt('Placed / Confirmed / Preparing / Out for Delivery / Delivered / Cancelled');
  if(s)await send(O+'/orders/'+id+'/status',{
    method:'PUT',headers:{
      'Content-Type':'application/json'
    },body:JSON.stringify({
      status:s
    })
  });
  orders()
}
async function cancel(id){
  try{
    await send(O+'/orders/'+id,{
      method:'DELETE'
    });
    orders()
  }
  catch(e){
    alert(e.message)
  }
}
restaurants();
menu();
loadCart();
loadWish();
orders();
