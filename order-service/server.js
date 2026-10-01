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
  service:'Order Service',status:'UP'
}));
app.get('/metrics',(q,s)=>s.type('text/plain').send(`http_requests_total{service="order"} ${n}\n`));
app.get('/orders',(q,s)=>s.json(L().orders));
app.post('/orders',(q,s)=>{
  let {
    customerName,restaurantId,items,totalAmount=0,address='',deliveryPersonName='Not assigned',deliveryPersonPhone='Not assigned'
  }
  =q.body;
  if(!customerName||restaurantId===undefined||!Array.isArray(items)||!items.length)return s.status(400).json({
    error:'customerName, restaurantId and items are required'
  });
  let d=L(),o={
    id:d.orders.length?Math.max(...d.orders.map(x=>x.id))+1:1,customerName,restaurantId,items,totalAmount:Number(totalAmount),address,status:'Placed',deliveryPersonName,deliveryPersonPhone,createdAt:new Date().toISOString()
  };
  d.orders.push(o);
  S(d);
  s.status(201).json(o)
});
app.put('/orders/:id/status',(q,s)=>{
  let d=L(),o=d.orders.find(x=>x.id==q.params.id),ok=['Placed','Confirmed','Preparing','Out for Delivery','Delivered','Cancelled'];
  if(!o)return s.status(404).json({
    error:'Order not found'
  });
  if(!ok.includes(q.body.status))return s.status(400).json({
    error:'Invalid status'
  });
  o.status=q.body.status;
  S(d);
  s.json(o)
});
app.delete('/orders/:id',(q,s)=>{
  let d=L(),o=d.orders.find(x=>x.id==q.params.id);
  if(!o)return s.status(404).json({
    error:'Order not found'
  });
  if((Date.now()-new Date(o.createdAt))/60000>20)return s.status(409).json({
    error:'Cancellation window expired. Orders can be cancelled only within 20 minutes.'
  });
  if(['Out for Delivery','Delivered','Cancelled'].includes(o.status))return s.status(409).json({
    error:'Order cannot be cancelled in current status'
  });
  o.status='Cancelled';
  o.cancelledAt=new Date().toISOString();
  S(d);
  s.json({
    message:'Order cancelled within 20 minutes',order:o
  })
});
app.use('/docs',swaggerUi.serve,swaggerUi.setup({
  openapi:'3.0.0',info:{
    title:'Order Service',version:'1.0.0'
  },paths:{
  }
}));
if(require.main===module)app.listen(8003,()=>console.log('Order Service: http://localhost:8003'));
module.exports=app;
