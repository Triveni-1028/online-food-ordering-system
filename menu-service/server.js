const express=require('express'),cors=require('cors'),helmet=require('helmet'),morgan=require('morgan'),swaggerUi=require('swagger-ui-express'),fs=require('fs'),path=require('path');
const app=express(),F=path.join(__dirname,'data/data.json');
let n=0;
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));
app.use((q,s,x)=>{
  n++;
  x()
});
const L=()=>JSON.parse(fs.readFileSync(F)),S=x=>fs.writeFileSync(F,JSON.stringify(x,null,2));
app.get('/health',(q,s)=>s.json({
  service:'Menu Service',status:'UP'
}));
app.get('/metrics',(q,s)=>s.type('text/plain').send(`http_requests_total{service="menu"} ${n}\n`));
app.get('/menu',(q,s)=>s.json(L().menu));
app.post('/menu',(q,s)=>{
  let {
    name,restaurantId,price,availability=true
  }
  =q.body;
  if(!name||restaurantId===undefined||price===undefined)return s.status(400).json({
    error:'name, restaurantId and price are required'
  });
  let d=L(),m={
    id:d.menu.length?Math.max(...d.menu.map(x=>x.id))+1:1,name,restaurantId:Number(restaurantId),price:Number(price),availability:Boolean(availability)
  };
  d.menu.push(m);
  S(d);
  s.status(201).json(m)
});
app.put('/menu/:id',(q,s)=>{
  let d=L(),m=d.menu.find(x=>x.id==q.params.id);
  if(!m)return s.status(404).json({
    error:'Food item not found'
  });
  Object.assign(m,q.body);
  if(q.body.price!==undefined)m.price=Number(q.body.price);
  S(d);
  s.json(m)
});
app.delete('/menu/:id',(q,s)=>{
  let d=L(),i=d.menu.findIndex(x=>x.id==q.params.id);
  if(i<0)return s.status(404).json({
    error:'Food item not found'
  });
  let m=d.menu.splice(i,1)[0];
  S(d);
  s.json({
    message:'Food item deleted',item:m
  })
});
app.get('/cart',(q,s)=>s.json(L().cart));
app.post('/cart',(q,s)=>{
  let d=L(),id=Number(q.body.menuItemId);
  if(!d.menu.some(x=>x.id===id))return s.status(404).json({
    error:'Food item not found'
  });
  let c=d.cart.find(x=>x.menuItemId===id);
  c?c.quantity+=Number(q.body.quantity||1):d.cart.push({
    menuItemId:id,quantity:Number(q.body.quantity||1)
  });
  S(d);
  s.status(201).json(d.cart)
});
app.get('/wishlist',(q,s)=>s.json(L().wishlist));
app.post('/wishlist',(q,s)=>{
  let d=L(),id=Number(q.body.menuItemId);
  if(!d.wishlist.includes(id))d.wishlist.push(id);
  S(d);
  s.status(201).json(d.wishlist)
});
app.delete('/wishlist/:id',(q,s)=>{
  let d=L();
  d.wishlist=d.wishlist.filter(x=>x!==Number(q.params.id));
  S(d);
  s.json(d.wishlist)
});
app.use('/docs',swaggerUi.serve,swaggerUi.setup({
  openapi:'3.0.0',info:{
    title:'Menu Service',version:'1.0.0'
  },paths:{
  }
}));
if(require.main===module)app.listen(8002,()=>console.log('Menu Service: http://localhost:8002'));
module.exports=app;
