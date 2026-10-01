const express=require('express'),cors=require('cors'),helmet=require('helmet'),morgan=require('morgan'),swaggerUi=require('swagger-ui-express'),fs=require('fs'),path=require('path');

const app=express(),FILE=path.join(__dirname,'data/data.json');
let n=0;
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));
app.use((q,s,x)=>{
  n++;
  x()
});
const load=()=>JSON.parse(fs.readFileSync(FILE)),save=x=>fs.writeFileSync(FILE,JSON.stringify(x,null,2));

app.get('/health',(q,s)=>s.json({
  service:'Restaurant Service',status:'UP'
}));
app.get('/metrics',(q,s)=>s.type('text/plain').send(`http_requests_total{service="restaurant"} ${n}\n`));
app.get('/restaurants',(q,s)=>s.json(load().restaurants));

app.post('/restaurants',(q,s)=>{
  let {
    name,location,phone='',status='Open'
  }
  =q.body;
  if(!name||!location)return s.status(400).json({
    error:'name and location are required'
  });
  let d=load(),r={
    id:d.restaurants.length?Math.max(...d.restaurants.map(x=>x.id))+1:1,name,location,phone,status
  };
  d.restaurants.push(r);
  save(d);
  s.status(201).json(r)
});

app.put('/restaurants/:id',(q,s)=>{
  let d=load(),r=d.restaurants.find(x=>x.id==q.params.id);
  if(!r)return s.status(404).json({
    error:'Restaurant not found'
  });
  Object.assign(r,q.body);
  save(d);
  s.json(r)
});
app.delete('/restaurants/:id',(q,s)=>{
  let d=load(),i=d.restaurants.findIndex(x=>x.id==q.params.id);
  if(i<0)return s.status(404).json({
    error:'Restaurant not found'
  });
  let r=d.restaurants.splice(i,1)[0];
  save(d);
  s.json({
    message:'Restaurant deleted',restaurant:r
  })
});

app.use('/docs',swaggerUi.serve,swaggerUi.setup({
  openapi:'3.0.0',info:{
    title:'Restaurant Service',version:'1.0.0'
  },paths:{
  }
}));
if(require.main===module)app.listen(8001,()=>console.log('Restaurant Service: http://localhost:8001'));
module.exports=app;
