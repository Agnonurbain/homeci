import { useState, useEffect, useMemo } from 'react';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { propertyService } from '../services/propertyService';
import { notificationService } from '../services/notificationService';
import type { Property } from '../services/propertyService';
import {
  FileCheck, CheckCircle, XCircle, Clock, FileText, Building2,
  MapPin, ExternalLink, Search, AlertCircle, X, Eye,
  RotateCcw, Stamp, ChevronDown, Phone, User, Calendar,
  ThumbsUp, ThumbsDown, Loader, BadgeCheck,
} from 'lucide-react';
import { KenteLine } from './ui/KenteLine';
import { HColors, HAlpha } from '../styles/homeci-tokens';

const TYPE_LABELS: Record<string, string> = {
  appartement:'Appartement', maison:'Maison', villa:'Villa',
  terrain:'Terrain', hotel:'Hôtel', appart_hotel:'Appart-Hôtel',
};
const DOC_LABELS: Record<string, string> = {
  titre_foncier:'Titre foncier', permis_construire:'Permis de construire',
  plan_cadastral:'Plan cadastral', certificat_propriete:'Certificat de propriété',
  arrete_lotissement:'Arrêté de lotissement',
  autorisation_exploitation:"Autorisation d'exploitation",
  registre_commerce:'Registre de commerce',
};
const REQUIRED_DOCS: Record<string, string[]> = {
  appartement:['titre_foncier','permis_construire'],
  maison:['titre_foncier','permis_construire'],
  villa:['titre_foncier','permis_construire'],
  terrain:['titre_foncier','plan_cadastral'],
  hotel:['titre_foncier','autorisation_exploitation','registre_commerce'],
  appart_hotel:['titre_foncier','autorisation_exploitation','registre_commerce'],
};

type DocStatus = 'en_attente'|'valide'|'refuse';
type TabId = 'disponible'|'en_cours'|'pret'|'certifie';

function isReadyToCertify(p: Property) {
  const req = REQUIRED_DOCS[p.property_type] || ['titre_foncier'];
  return req.every(r => p.documents?.find(d => d.type === r)?.status === 'valide');
}
function getDocStatus(p: Property): 'aucun'|'partiel'|'complet'|'certifie' {
  if (p.verified_notaire) return 'certifie';
  if (!p.documents?.length) return 'aucun';
  return isReadyToCertify(p) ? 'complet' : p.documents.some(d => d.status === 'valide') ? 'partiel' : 'aucun';
}
interface OwnerProfile { full_name:string; phone?:string; email?:string; }

export default function NotaireDashboard() {
  const { profile } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [owners, setOwners] = useState<Record<string, OwnerProfile>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('disponible');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');
  const [expandedId, setExpandedId] = useState<string|null>(null);
  const [actionLoading, setActionLoading] = useState<string|null>(null);
  const [certifyingId, setCertifyingId] = useState<string|null>(null);
  const [takingId, setTakingId] = useState<string|null>(null);
  const [refusalReasons, setRefusalReasons] = useState<Record<string,string>>({});
  const [showRefusalInput, setShowRefusalInput] = useState<string|null>(null);
  const [toast, setToast] = useState<{msg:string;ok:boolean}|null>(null);

  useEffect(() => { loadProperties(); }, []);

  async function loadProperties() {
    setLoading(true);
    try {
      const all = await propertyService.getProperties();
      // Un notaire voit : les biens sans notaire_id (disponibles) + les siens
      const withDocs = all.filter(p =>
        (p.documents?.length > 0 || p.verified_notaire) &&
        (!p.notaire_id || p.notaire_id === profile?.id)
      );
      setProperties(withDocs);
      const ownerIds = [...new Set(withDocs.map(p => p.owner_id))];
      const entries = await Promise.all(ownerIds.map(async id => {
        try {
          const snap = await getDoc(doc(db,'profiles',id));
          if (snap.exists()) { const d = snap.data(); return [id,{full_name:d.full_name||'Propriétaire',phone:d.phone,email:d.email}] as [string,OwnerProfile]; }
        } catch {}
        return [id,{full_name:'Propriétaire'}] as [string,OwnerProfile];
      }));
      setOwners(Object.fromEntries(entries));
    } catch(e){ console.error(e); }
    finally { setLoading(false); }
  }

  function showToast(msg:string,ok=true){ setToast({msg,ok}); setTimeout(()=>setToast(null),3500); }

  async function handleDocAction(property:Property,docType:string,newStatus:DocStatus){
    const key=`${docType}:${property.id}`; setActionLoading(key);
    try {
      const reason=refusalReasons[key]||'';
      const updatedDocs:typeof property.documents=property.documents.map(d=>{
        if(d.type!==docType) return d;
        const u:typeof d={...d,status:newStatus};
        if(newStatus==='valide') u.validated_at=new Date().toISOString(); else delete u.validated_at;
        if(newStatus==='refuse'&&reason) u.rejection_reason=reason; else delete u.rejection_reason;
        return u;
      });
      await propertyService.updateProperty(property.id,{documents:updatedDocs});
      const lbl=DOC_LABELS[docType]||docType;
      const stLbl=newStatus==='valide'?'validé ✅':newStatus==='refuse'?'refusé ❌':'remis en attente';
      await notificationService.createNotification({user_id:property.owner_id,type:'system',
        title:`📄 Document ${newStatus==='valide'?'validé':newStatus==='refuse'?'refusé':'en attente'}`,
        message:`Votre ${lbl} pour "${property.title}" a été ${stLbl}${reason?` : ${reason}`:''}`,
        property_id:property.id,
      });
      setProperties(prev=>prev.map(p=>p.id===property.id?{...p,documents:updatedDocs}:p));
      setShowRefusalInput(null); showToast(`${lbl} ${stLbl}`);
    } catch { showToast('Erreur lors de la mise à jour',false); }
    finally { setActionLoading(null); }
  }

  async function handleCertify(property:Property){
    if(!isReadyToCertify(property)) return; setCertifyingId(property.id);
    try {
      await propertyService.updateProperty(property.id,{verified_notaire:true,verification_date:new Date().toISOString(),status:'published'});
      await notificationService.createNotification({user_id:property.owner_id,type:'system',
        title:'🏆 Bien certifié Notaire !',
        message:`Votre bien "${property.title}" a obtenu le badge "Vérifié Notaire" et est maintenant publié.`,
        property_id:property.id,
      });
      setProperties(prev=>prev.map(p=>p.id===property.id?{...p,verified_notaire:true,status:'published'}:p));
      setExpandedId(null); setActiveTab('certifie');
      showToast('✅ Bien certifié ! Badge "Vérifié Notaire" accordé.');
    } catch { showToast('Erreur lors de la certification',false); }
    finally { setCertifyingId(null); }
  }

  async function handleRevoke(property:Property){
    if(!confirm(`Retirer la certification "Vérifié Notaire" de "${property.title}" ?`)) return;
    setCertifyingId(property.id);
    try {
      await propertyService.updateProperty(property.id,{verified_notaire:false,verification_date:null});
      setProperties(prev=>prev.map(p=>p.id===property.id?{...p,verified_notaire:false}:p));
      showToast('Certification retirée.');
    } catch { showToast('Erreur',false); }
    finally { setCertifyingId(null); }
  }

  async function handleTakeCharge(property: Property) {
    if (!profile?.id) return;
    setTakingId(property.id);
    try {
      await propertyService.updateProperty(property.id, { notaire_id: profile.id });
      setProperties(prev => prev.map(p => p.id === property.id ? { ...p, notaire_id: profile.id } : p));
      setActiveTab('en_cours');
      showToast('Dossier pris en charge — il apparaît dans "En cours".');
    } catch { showToast('Erreur lors de la prise en charge', false); }
    finally { setTakingId(null); }
  }

  const {disponible,enCours,pret,certifie}=useMemo(()=>{
    const ec:Property[]=[],pr:Property[]=[],ce:Property[]=[];
    for(const p of properties){
      const s=getDocStatus(p);
      if(s==='certifie') ce.push(p); else if(s==='complet') pr.push(p); else ec.push(p);
    }
    return {enCours:ec,pret:pr,certifie:ce};
  },[properties]);

  const currentList=activeTab==='disponible'?disponible:activeTab==='en_cours'?enCours:activeTab==='pret'?pret:certifie;
  const filtered=useMemo(()=>{
    let list=[...currentList];
    if(searchQuery){ const q=searchQuery.toLowerCase(); list=list.filter(p=>p.title.toLowerCase().includes(q)||p.city?.toLowerCase().includes(q)||(owners[p.owner_id]?.full_name||'').toLowerCase().includes(q)); }
    if(filterType) list=list.filter(p=>p.property_type===filterType);
    return list;
  },[currentList,searchQuery,filterType,owners]);

  const stats=useMemo(()=>({
    disponible:disponible.length, enCours:enCours.length, pret:pret.length, certifie:certifie.length,
    docsAttente:properties.flatMap(p=>p.documents||[]).filter(d=>d.status==='en_attente').length,
    docsValides:properties.flatMap(p=>p.documents||[]).filter(d=>d.status==='valide').length,
  }),[disponible,enCours,pret,certifie,properties,profile?.id]);

  if(loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{background:HColors.creamBg}}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-14 h-14 rounded-full border-4 border-t-transparent animate-spin"
          style={{borderColor:HAlpha.gold20,borderTopColor:HColors.gold}}/>
        <p style={{color:HColors.brown,fontFamily:'var(--font-nunito)',fontSize:'0.875rem'}}>Chargement des dossiers…</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{background:HColors.creamBg}}>

      {/* ── Header ── */}
      <div style={{background:HColors.night,borderBottom:`1px solid ${HAlpha.gold20}`}}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-0">
          <div className="flex items-center justify-between gap-4 flex-wrap pb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{background:HAlpha.gold15,border:`1px solid ${HAlpha.gold30}`}}>
                <Stamp className="w-5 h-5" style={{color:HColors.gold}}/>
              </div>
              <div>
                <h1 className="font-bold" style={{color:HColors.cream,fontFamily:'var(--font-cormorant)',fontSize:'1.6rem'}}>
                  Espace Notaire
                </h1>
                <p className="text-sm flex items-center gap-2" style={{color:HAlpha.cream50,fontFamily:'var(--font-nunito)'}}>
                  Bonjour, {profile?.full_name?.split(' ')[0]||'Notaire'}
                  {stats.docsAttente>0&&(
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                      style={{background:HAlpha.gold20,color:HColors.gold,border:`1px solid ${HAlpha.gold35}`}}>
                      {stats.docsAttente} doc{stats.docsAttente>1?'s':''} à examiner
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 text-xs" style={{fontFamily:'var(--font-nunito)'}}>
                <span className="px-2.5 py-1 rounded-full font-semibold"
                  style={{background:HAlpha.green10,color:HColors.green,border:`1px solid ${HAlpha.green25}`}}>
                  {stats.docsValides} validé{stats.docsValides>1?'s':''}
                </span>
                <span className="px-2.5 py-1 rounded-full font-semibold"
                  style={{background:HAlpha.gold10,color:HColors.brownMid,border:`1px solid ${HAlpha.gold25}`}}>
                  {stats.docsAttente} en attente
                </span>
                <span className="px-2.5 py-1 rounded-full font-semibold"
                  style={{background:HAlpha.navy08,color:HColors.navy,border:`1px solid ${HAlpha.navy20}`}}>
                  {stats.certifie} certifié{stats.certifie>1?'s':''}
                </span>
              </div>
              <button onClick={loadProperties} aria-label="Actualiser"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all hover:opacity-80"
                style={{background:HAlpha.gold10,border:`1px solid ${HAlpha.gold25}`,color:HColors.brownMid,fontFamily:'var(--font-nunito)'}}>
                <RotateCcw className="w-3.5 h-3.5"/> Actualiser
              </button>
            </div>
          </div>

          {/* Tabs */}
          <nav className="flex gap-1 overflow-x-auto">
            {([
              {id:'disponible',label:'Disponibles',     count:stats.disponible,accent:HColors.terracotta,bg:HAlpha.terra10, bd:HAlpha.terra28},
              {id:'en_cours',label:'En cours',          count:stats.enCours,  accent:HColors.brownMid, bg:HAlpha.gold10,  bd:HAlpha.gold25 },
              {id:'pret',     label:'Prêts à certifier',count:stats.pret,     accent:HColors.navy,     bg:HAlpha.navy08,  bd:HAlpha.navy20 },
              {id:'certifie', label:'Certifiés',        count:stats.certifie, accent:HColors.green,    bg:HAlpha.green10, bd:HAlpha.green25},
            ] as const).map(tab=>(
              <button key={tab.id} onClick={()=>setActiveTab(tab.id)}
                aria-label={tab.label} aria-current={activeTab===tab.id?'page':undefined}
                className="flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap"
                style={activeTab===tab.id
                  ?{borderColor:HColors.gold,color:HColors.gold,fontFamily:'var(--font-nunito)'}
                  :{borderColor:'transparent',color:HAlpha.cream45,fontFamily:'var(--font-nunito)'}}>
                {tab.label}
                <span className="px-1.5 py-0.5 rounded-full text-xs font-bold"
                  style={activeTab===tab.id
                    ?{background:tab.bg,color:tab.accent,border:`1px solid ${tab.bd}`}
                    :{background:HAlpha.gold08,color:HAlpha.cream50}}>
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Recherche + filtre */}
        <div className="flex gap-3 mb-5 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{color:HColors.brown}}/>
            <input type="text" value={searchQuery} onChange={e=>setSearchQuery(e.target.value)}
              placeholder="Bien, ville, propriétaire…"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm outline-none"
              style={{background:'rgba(255,255,255,0.85)',border:`1px solid ${HAlpha.gold20}`,color:HColors.darkBrown,fontFamily:'var(--font-nunito)'}}/>
          </div>
          <select value={filterType} onChange={e=>setFilterType(e.target.value)}
            className="px-3 py-2.5 rounded-xl text-sm outline-none"
            style={{background:'rgba(255,255,255,0.85)',border:`1px solid ${HAlpha.gold20}`,color:HColors.darkBrown,fontFamily:'var(--font-nunito)'}}>
            <option value="">Tous les types</option>
            {Object.entries(TYPE_LABELS).map(([k,v])=><option key={k} value={k}>{v}</option>)}
          </select>
          {(searchQuery||filterType)&&(
            <button onClick={()=>{setSearchQuery('');setFilterType('');}}
              className="flex items-center gap-1.5 px-3 py-2.5 text-sm rounded-xl transition-all hover:opacity-80"
              style={{background:HAlpha.bord10,border:`1px solid ${HAlpha.bord25}`,color:HColors.bordeaux,fontFamily:'var(--font-nunito)'}}>
              <X className="w-3.5 h-3.5"/> Effacer
            </button>
          )}
          <p className="self-center text-sm" style={{color:HColors.brown,fontFamily:'var(--font-nunito)'}}>
            {filtered.length} dossier{filtered.length>1?'s':''}
          </p>
        </div>

        {/* Banner disponibles */}
        {activeTab==='disponible'&&filtered.length>0&&(
          <div className="mb-4 flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{background:HAlpha.terra10,border:`1px solid ${HAlpha.terra28}`}}>
            <FileCheck className="w-4 h-4 shrink-0" style={{color:HColors.terracotta}}/>
            <span className="text-sm" style={{color:HColors.terracotta,fontFamily:'var(--font-nunito)'}}>
              Ces dossiers sont disponibles — cliquez <strong>Prendre en charge</strong> pour les assigner à votre espace.
            </span>
          </div>
        )}

        {/* Banner prêts à certifier */}
        {activeTab==='pret'&&filtered.length>0&&(
          <div className="mb-4 flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{background:HAlpha.navy08,border:`1px solid ${HAlpha.navy20}`}}>
            <BadgeCheck className="w-4 h-4 shrink-0" style={{color:HColors.navy}}/>
            <span className="text-sm" style={{color:HColors.navy,fontFamily:'var(--font-nunito)'}}>
              Ces biens ont tous leurs documents validés — accordez leur le badge <strong>Vérifié Notaire</strong>.
            </span>
          </div>
        )}

        {/* Liste vide */}
        {filtered.length===0?(
          <div className="rounded-2xl p-16 text-center"
            style={{background:HColors.white,border:`1px solid ${HAlpha.gold15}`}}>
            <FileCheck className="w-12 h-12 mx-auto mb-3" style={{color:HAlpha.gold20}}/>
            <p className="text-sm" style={{color:HColors.brown,fontFamily:'var(--font-nunito)'}}>
              {activeTab==='disponible'?'Aucun dossier disponible':activeTab==='en_cours'?'Aucun dossier en cours':activeTab==='pret'?'Aucun dossier prêt à certifier':"Aucun bien certifié pour l'instant"}
            </p>
          </div>
        ):(
          <div className="space-y-3">
            {filtered.map(property=>{
              const docSt=getDocStatus(property);
              const isExpanded=expandedId===property.id;
              const required=REQUIRED_DOCS[property.property_type]||['titre_foncier'];
              const ready=isReadyToCertify(property);
              const owner=owners[property.owner_id];
              const validatedReq=required.filter(r=>property.documents?.find(d=>d.type===r)?.status==='valide').length;
              const pct=required.length>0?Math.round((validatedReq/required.length)*100):0;
              const stColors={
                certifie:{border:HAlpha.green30, bar:HColors.green},
                complet: {border:HAlpha.navy20,  bar:HColors.navy},
                partiel: {border:HAlpha.gold35,  bar:HColors.gold},
                aucun:   {border:HAlpha.gold15,  bar:HAlpha.gold20},
              }[docSt];

              return (
                <div key={property.id} className="rounded-2xl overflow-hidden transition-all"
                  style={{background:HColors.white,border:`1px solid ${stColors.border}`,boxShadow:'0 2px 12px rgba(26,14,0,0.05)'}}>
                  <div className="h-1" style={{background:stColors.bar,opacity:0.45}}/>

                  <div className="flex gap-4 p-4 items-start">
                    {property.images?.[0]?(
                      <img src={property.images[0]} alt={property.title}
                        className="w-16 h-16 rounded-xl object-cover shrink-0"
                        style={{border:`1px solid ${HAlpha.gold15}`}}/>
                    ):(
                      <div className="w-16 h-16 rounded-xl flex items-center justify-center shrink-0"
                        style={{background:HAlpha.gold08,border:`1px solid ${HAlpha.gold15}`}}>
                        <Building2 className="w-6 h-6" style={{color:HAlpha.gold30}}/>
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                          <h3 className="font-bold text-sm leading-tight"
                            style={{color:HColors.darkBrown,fontFamily:'var(--font-cormorant)',fontSize:'1rem'}}>
                            {property.title}
                          </h3>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap text-xs"
                            style={{color:HColors.brown,fontFamily:'var(--font-nunito)'}}>
                            <span className="flex items-center gap-1"><Building2 className="w-3 h-3"/>{TYPE_LABELS[property.property_type]}</span>
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" style={{color:HColors.terracotta}}/>{[property.city,property.commune,property.quartier].filter(Boolean).join(', ')}</span>
                            {owner&&<span className="flex items-center gap-1"><User className="w-3 h-3"/>{owner.full_name}</span>}
                          </div>
                        </div>
                        <DocStatusBadgeFull status={docSt}/>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{background:HAlpha.gold08}}>
                          <div className="h-full rounded-full transition-all"
                            style={{width:`${pct}%`,background:pct===100?HColors.green:pct>0?HColors.gold:HAlpha.gold20}}/>
                        </div>
                        <span className="text-xs shrink-0" style={{color:HColors.brown,fontFamily:'var(--font-nunito)'}}>
                          {validatedReq}/{required.length} requis
                        </span>
                        <span className="text-xs" style={{color:HAlpha.brown50,fontFamily:'var(--font-nunito)'}}>
                          {property.documents?.length||0} soumis
                        </span>
                      </div>
                    </div>

                    {activeTab==='disponible' ? (
                      <button onClick={()=>handleTakeCharge(property)}
                        disabled={takingId===property.id}
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl shrink-0 self-start transition-all hover:opacity-90 disabled:opacity-50"
                        style={{background:'linear-gradient(135deg,#D4A017,#C07C3E)',color:HColors.night,fontFamily:'var(--font-nunito)'}}>
                        {takingId===property.id?<Loader className="w-3.5 h-3.5 animate-spin"/>:<FileCheck className="w-3.5 h-3.5"/>}
                        Prendre en charge
                      </button>
                    ) : (
                      <button onClick={()=>setExpandedId(isExpanded?null:property.id)}
                      aria-label={isExpanded?'Fermer':`Examiner ${property.title}`}
                      aria-expanded={isExpanded}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl shrink-0 self-start transition-all hover:opacity-80"
                      style={isExpanded
                        ?{background:HAlpha.green10,border:`1px solid ${HAlpha.green25}`,color:HColors.green,fontFamily:'var(--font-nunito)'}
                        :{background:HAlpha.gold08,border:`1px solid ${HAlpha.gold20}`,color:HColors.brownMid,fontFamily:'var(--font-nunito)'}}>
                      <Eye className="w-3.5 h-3.5"/>
                      {isExpanded?'Fermer':'Examiner'}
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded?'rotate-180':''}`}/>
                    </button>
                    )}
                  </div>

                  {isExpanded&&(
                    <div className="border-t p-4 space-y-4"
                      style={{borderColor:HAlpha.gold15,background:'rgba(249,243,232,0.5)'}}>

                      {owner&&(
                        <div className="flex items-center gap-3 p-3 rounded-xl"
                          style={{background:HColors.white,border:`1px solid ${HAlpha.gold15}`}}>
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                            style={{background:HAlpha.green10,border:`1px solid ${HAlpha.green20}`}}>
                            <User className="w-4 h-4" style={{color:HColors.green}}/>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold" style={{color:HColors.darkBrown,fontFamily:'var(--font-nunito)'}}>{owner.full_name}</p>
                            <div className="flex gap-3 text-xs flex-wrap" style={{color:HColors.brown,fontFamily:'var(--font-nunito)'}}>
                              {owner.phone&&<span className="flex items-center gap-1"><Phone className="w-3 h-3" style={{color:HColors.terracotta}}/>{owner.phone}</span>}
                              {owner.email&&<span>{owner.email}</span>}
                            </div>
                          </div>
                          {property.verification_date&&(
                            <div className="text-xs flex items-center gap-1 shrink-0" style={{color:HColors.green,fontFamily:'var(--font-nunito)'}}>
                              <Calendar className="w-3 h-3"/>
                              Certifié le {new Date(property.verification_date).toLocaleDateString('fr-FR')}
                            </div>
                          )}
                        </div>
                      )}

                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider mb-2"
                          style={{color:HAlpha.brown50,fontFamily:'var(--font-nunito)'}}>Documents soumis</h4>
                        <div className="space-y-2">
                          {(property.documents||[]).map(docItem=>{
                            const actionKey=`${docItem.type}:${property.id}`;
                            const isLoadingDoc=actionLoading===actionKey;
                            const isRequired=required.includes(docItem.type);
                            const isShowingRefusal=showRefusalInput===actionKey;
                            return (
                              <div key={docItem.type} className="rounded-xl overflow-hidden"
                                style={{background:HColors.white,border:`1px solid ${HAlpha.gold15}`}}>
                                <div className="flex items-center gap-3 p-3">
                                  <FileText className="w-4 h-4 shrink-0" style={{color:HColors.brown}}/>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-sm font-medium" style={{color:HColors.darkBrown,fontFamily:'var(--font-nunito)'}}>
                                        {docItem.label||DOC_LABELS[docItem.type]||docItem.type}
                                      </span>
                                      {isRequired&&(
                                        <span className="text-xs px-1.5 py-0.5 rounded font-medium"
                                          style={{background:HAlpha.navy08,color:HColors.navy}}>Requis</span>
                                      )}
                                      <DocStatusBadge status={docItem.status as DocStatus}/>
                                    </div>
                                    {docItem.status==='valide'&&docItem.validated_at&&(
                                      <p className="text-xs mt-0.5" style={{color:HAlpha.brown50,fontFamily:'var(--font-nunito)'}}>
                                        Validé le {new Date(docItem.validated_at).toLocaleDateString('fr-FR')}
                                      </p>
                                    )}
                                    {docItem.status==='refuse'&&(docItem as any).rejection_reason&&(
                                      <p className="text-xs mt-0.5" style={{color:HColors.bordeaux,fontFamily:'var(--font-nunito)'}}>
                                        Motif : {(docItem as any).rejection_reason}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    {docItem.url&&(
                                      <a href={docItem.url} target="_blank" rel="noopener noreferrer"
                                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-all hover:opacity-80"
                                        style={{background:HAlpha.navy08,border:`1px solid ${HAlpha.navy20}`,color:HColors.navy}}>
                                        <ExternalLink className="w-3 h-3"/> Consulter
                                      </a>
                                    )}
                                    {!property.verified_notaire&&(
                                      <>
                                        {docItem.status!=='valide'&&(
                                          <button onClick={()=>handleDocAction(property,docItem.type,'valide')}
                                            disabled={isLoadingDoc}
                                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-all hover:opacity-80 disabled:opacity-50"
                                            style={{background:HAlpha.green10,border:`1px solid ${HAlpha.green25}`,color:HColors.green}}>
                                            {isLoadingDoc?<Loader className="w-3 h-3 animate-spin"/>:<ThumbsUp className="w-3 h-3"/>}
                                            Valider
                                          </button>
                                        )}
                                        {docItem.status!=='refuse'&&(
                                          <button onClick={()=>setShowRefusalInput(isShowingRefusal?null:actionKey)}
                                            disabled={isLoadingDoc}
                                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-all hover:opacity-80 disabled:opacity-50"
                                            style={{background:HAlpha.bord10,border:`1px solid ${HAlpha.bord25}`,color:HColors.bordeaux}}>
                                            <ThumbsDown className="w-3 h-3"/> Refuser
                                          </button>
                                        )}
                                        {docItem.status!=='en_attente'&&(
                                          <button onClick={()=>handleDocAction(property,docItem.type,'en_attente')}
                                            disabled={isLoadingDoc} aria-label="Remettre en attente"
                                            className="p-1.5 rounded-lg transition-all hover:opacity-70"
                                            style={{background:HAlpha.gold08,border:`1px solid ${HAlpha.gold20}`,color:HColors.brownMid}}>
                                            <RotateCcw className="w-3 h-3"/>
                                          </button>
                                        )}
                                      </>
                                    )}
                                  </div>
                                </div>
                                {isShowingRefusal&&!property.verified_notaire&&(
                                  <div className="border-t flex gap-2 px-3 pb-3 pt-2"
                                    style={{borderColor:HAlpha.bord15,background:HAlpha.bord10}}>
                                    <input type="text" value={refusalReasons[actionKey]||''}
                                      onChange={e=>setRefusalReasons(r=>({...r,[actionKey]:e.target.value}))}
                                      placeholder="Motif de refus (ex : document illisible, non conforme…)"
                                      className="flex-1 px-3 py-1.5 text-xs rounded-lg outline-none"
                                      style={{background:HColors.white,border:`1px solid ${HAlpha.bord25}`,color:HColors.darkBrown,fontFamily:'var(--font-nunito)'}}/>
                                    <button onClick={()=>handleDocAction(property,docItem.type,'refuse')}
                                      disabled={isLoadingDoc}
                                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all hover:opacity-90 disabled:opacity-50"
                                      style={{background:HColors.bordeaux,color:HColors.cream}}>
                                      {isLoadingDoc?<Loader className="w-3 h-3 animate-spin"/>:<XCircle className="w-3 h-3"/>}
                                      Confirmer
                                    </button>
                                    <button onClick={()=>setShowRefusalInput(null)} aria-label="Annuler"
                                      className="p-1.5 rounded-lg transition-all hover:opacity-70"
                                      style={{color:HColors.brown}}>
                                      <X className="w-3.5 h-3.5"/>
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {(()=>{
                          const missing=required.filter(r=>!property.documents?.find(d=>d.type===r));
                          if(!missing.length) return null;
                          return (
                            <div className="flex items-start gap-2 mt-2 p-3 rounded-xl"
                              style={{background:HAlpha.gold08,border:`1px solid ${HAlpha.gold25}`}}>
                              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" style={{color:HColors.gold}}/>
                              <div className="text-xs" style={{color:HColors.brownMid,fontFamily:'var(--font-nunito)'}}>
                                <span className="font-semibold">Documents requis non soumis : </span>
                                {missing.map(m=>DOC_LABELS[m]||m).join(', ')}
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      <div className="flex items-center justify-between gap-3 p-4 rounded-xl"
                        style={ready&&!property.verified_notaire
                          ?{background:HAlpha.navy08,border:`1px solid ${HAlpha.navy20}`}
                          :{background:HAlpha.gold05,border:`1px solid ${HAlpha.gold15}`}}>
                        <div className="text-xs flex items-center gap-1.5" style={{color:HColors.brown,fontFamily:'var(--font-nunito)'}}>
                          {property.verified_notaire?(
                            <><BadgeCheck className="w-4 h-4" style={{color:HColors.green}}/> Badge "Vérifié Notaire" accordé</>
                          ):ready?(
                            <><CheckCircle className="w-4 h-4 shrink-0" style={{color:HColors.navy}}/> Tous les documents requis validés — prêt à certifier</>
                          ):(
                            <><AlertCircle className="w-4 h-4 shrink-0" style={{color:HColors.brown}}/> Documents requis manquants ou non encore tous validés</>
                          )}
                        </div>
                        {property.verified_notaire?(
                          <button onClick={()=>handleRevoke(property)} disabled={certifyingId===property.id}
                            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl transition-all hover:opacity-80 disabled:opacity-50"
                            style={{background:HAlpha.bord10,border:`1px solid ${HAlpha.bord25}`,color:HColors.bordeaux,fontFamily:'var(--font-nunito)'}}>
                            <XCircle className="w-3.5 h-3.5"/> Retirer la certification
                          </button>
                        ):(
                          <button onClick={()=>handleCertify(property)} disabled={!ready||certifyingId===property.id}
                            className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-xl transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                            style={{background:ready?'linear-gradient(135deg,#D4A017,#C07C3E)':HAlpha.gold10,
                                    color:ready?HColors.night:HColors.brown,fontFamily:'var(--font-nunito)'}}>
                            {certifyingId===property.id?<Loader className="w-4 h-4 animate-spin"/>:<Stamp className="w-4 h-4"/>}
                            Certifier ce bien
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast&&(
        <div className="fixed bottom-6 right-6 z-50 overflow-hidden rounded-2xl shadow-2xl" style={{minWidth:260}}>
          <KenteLine height={3}/>
          <div className="flex items-center gap-2 px-4 py-3"
            style={{background:toast.ok?HColors.night:HColors.bordeaux}}>
            {toast.ok?<CheckCircle className="w-4 h-4 shrink-0" style={{color:HColors.gold}}/>
                     :<XCircle className="w-4 h-4 shrink-0" style={{color:HColors.cream}}/>}
            <span className="text-sm font-medium" style={{color:HColors.cream,fontFamily:'var(--font-nunito)'}}>{toast.msg}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function DocStatusBadgeFull({status}:{status:'aucun'|'partiel'|'complet'|'certifie'}){
  const cfg={
    certifie:{bg:HAlpha.green10,bd:HAlpha.green25,text:HColors.green,   label:'Certifié',        icon:<Stamp className="w-3 h-3"/>},
    complet: {bg:HAlpha.navy08, bd:HAlpha.navy20, text:HColors.navy,    label:'Prêt à certifier',icon:<CheckCircle className="w-3 h-3"/>},
    partiel: {bg:HAlpha.gold10, bd:HAlpha.gold25, text:HColors.brownMid,label:'En cours',         icon:<Clock className="w-3 h-3"/>},
    aucun:   {bg:HAlpha.gold08, bd:HAlpha.gold15, text:HColors.brown,   label:'En attente',       icon:<Clock className="w-3 h-3"/>},
  }[status];
  return(
    <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold shrink-0"
      style={{background:cfg.bg,border:`1px solid ${cfg.bd}`,color:cfg.text,fontFamily:'var(--font-nunito)'}}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

function DocStatusBadge({status}:{status:DocStatus}){
  const cfg:Record<DocStatus,{bg:string;bd:string;text:string;label:string}>={
    en_attente:{bg:HAlpha.gold10, bd:HAlpha.gold25, text:HColors.brownMid, label:'En attente'},
    valide:    {bg:HAlpha.green10,bd:HAlpha.green25,text:HColors.green,    label:'Validé'},
    refuse:    {bg:HAlpha.bord10, bd:HAlpha.bord25, text:HColors.bordeaux, label:'Refusé'},
  };
  const {bg,bd,text,label}=cfg[status]||cfg.en_attente;
  return(
    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
      style={{background:bg,border:`1px solid ${bd}`,color:text,fontFamily:'var(--font-nunito)'}}>
      {label}
    </span>
  );
}
