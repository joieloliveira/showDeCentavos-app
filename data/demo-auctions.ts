import type { Auction } from '@/types/auction';
export const demoAuctions: Auction[] = [
  { id:'1',slug:'console-next-gen',title:'Console de última geração',category:'Games',status:'live',retailPriceCents:349900,bidPriceCents:324,secondsLeft:38,bidders:128,emoji:'🎮',accent:'#b6a8ef',featured:true },
  { id:'2',slug:'smartphone-premium',title:'Smartphone Premium 256 GB',category:'Tecnologia',status:'live',retailPriceCents:459900,bidPriceCents:581,secondsLeft:22,bidders:203,emoji:'📱',accent:'#a4d7d7' },
  { id:'3',slug:'fone-wireless',title:'Fone de ouvido sem fio',category:'Áudio',status:'live',retailPriceCents:89900,bidPriceCents:137,secondsLeft:56,bidders:64,emoji:'🎧',accent:'#eec1b5' },
  { id:'4',slug:'smartwatch-pro',title:'Smartwatch esportivo Pro',category:'Acessórios',status:'live',retailPriceCents:129900,bidPriceCents:212,secondsLeft:44,bidders:86,emoji:'⌚',accent:'#c9cfaa' },
  { id:'5',slug:'notebook-ultrafino',title:'Notebook ultrafino 16 GB',category:'Informática',status:'upcoming',retailPriceCents:599900,bidPriceCents:0,secondsLeft:0,bidders:0,emoji:'💻',accent:'#b4c2dd' },
  { id:'6',slug:'cafeteira-automatica',title:'Cafeteira automática',category:'Casa',status:'upcoming',retailPriceCents:189900,bidPriceCents:0,secondsLeft:0,bidders:0,emoji:'☕',accent:'#dec9b1' },
];
