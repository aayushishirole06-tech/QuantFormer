import {useEffect,useRef} from 'react';
import {createChart,AreaSeries,ColorType} from 'lightweight-charts';
export default function PriceChart({points}){
 const el=useRef(null), chart=useRef(null), series=useRef(null);
 useEffect(()=>{if(!el.current)return;const c=createChart(el.current,{width:el.current.clientWidth,height:270,layout:{background:{type:ColorType.Solid,color:'#101a29'},textColor:'#9fb0c8'},grid:{vertLines:{color:'#203047'},horzLines:{color:'#203047'}}});const s=c.addSeries(AreaSeries,{lineColor:'#66e3c4',topColor:'rgba(102,227,196,.25)',bottomColor:'rgba(102,227,196,.01)'});chart.current=c;series.current=s;const resize=()=>c.applyOptions({width:el.current?.clientWidth||600});window.addEventListener('resize',resize);return()=>{window.removeEventListener('resize',resize);c.remove()}},[]);
 useEffect(()=>{if(!series.current||!points.length)return;const p=points.map((x,i)=>({time:Math.floor(new Date(x.time).getTime()/1000)+i,value:x.price}));series.current.setData(p.filter((x,i)=>i===0||x.time>p[i-1].time));chart.current?.timeScale().fitContent()},[points]);
 return <div ref={el} className=\"chart\"/>
}
