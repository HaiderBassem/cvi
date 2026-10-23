/**
 * Every FBX the studio supplied, with the id its GLB is published under
 * (public/models/projects/<id>.glb). Ids are stable; project ↔ model links live in
 * the database (projects.model_id), editable from the admin.
 */
export const SOURCES = [
  // Commercial
  { id: 'al-kadhimiya-resort', label: 'Al Kadhimiya Resort', file: 'FBX PROJECTS/COMMERICAL/AL KADHIMIYA RESORT/KRR.fbx' },
  { id: 'bmc-management', label: 'BMC Management Building', file: 'FBX PROJECTS/COMMERICAL/bmc mangemnet/BMW ALBINAALMARKAZY MANAGEMENT.fbx' },
  { id: 'budoor-al-najaf-management', label: 'Budoor Al-Najaf Management', file: 'FBX PROJECTS/COMMERICAL/budoor al najaf mangement/BUDOOR AL NAJAF MANGEMENT.fbx' },
  { id: 'budoor-al-najaf-sales-center', label: 'Budoor Al-Najaf Sales Center', file: 'FBX PROJECTS/COMMERICAL/budoor al najaf sales center/budoor al najaf sales center.fbx' },
  { id: 'budoor-zoo', label: 'Budoor Zoo', file: 'FBX PROJECTS/COMMERICAL/BUDOOR ZOO/ZOO-3DView-{3D}.fbx' },
  { id: 'restaurant-606', label: '606 Restaurant', file: 'FBX PROJECTS/COMMERICAL/RESTAURANT 606/resturant 606.fbx' },
  // Industrial
  { id: 'bmc-workshops', label: 'Al Binaa Al Markazi Workshops', file: 'FBX PROJECTS/INDUSTIRIAL/AL BINAA AL MARKAZI WORKSHOPS/BMC WORKSHOPS.fbx' },
  { id: 'aldyar-management', label: 'Al-Diyar Management', file: 'FBX PROJECTS/INDUSTIRIAL/ALDYAR MANAGMENT/ALDYARMANAGMENT.fbx' },
  { id: 'glass-factory-management', label: 'Glass Factory Management (CBC Site)', file: 'FBX PROJECTS/INDUSTIRIAL/Glass factory Management/CBC SITE.fbx' },
  { id: 'medical-industrial-city', label: 'Medical Industrial City (Pharmacity)', file: 'FBX PROJECTS/INDUSTIRIAL/MEDICAL INDUSTIRAIL CITY/PHARMACITY.fbx' },
  // Residential
  { id: 'al-hanana-villa', label: 'Al Hanana Villa', file: 'FBX PROJECTS/RESIDENTIAL/AL HANANA VILLA/AL HANANA VILLA.fbx' },
  { id: 'al-sadr-towers', label: 'Al Sadr Towers', file: 'FBX PROJECTS/RESIDENTIAL/AL SADR TOWERS/AL SADR TOWERS.fbx' },
  { id: 'al-zareef', label: 'Al-Zareef', file: 'FBX PROJECTS/RESIDENTIAL/AL ZAREEF/AL ZAREEF.fbx' },
  { id: 'maitham-house', label: 'Maitham House Façade', file: 'FBX PROJECTS/RESIDENTIAL/maitham house/MAITHAMHOUSEFACADE.fbx' },
  { id: 'zulfiqar-villa', label: 'Zulfiqar Villa', file: 'FBX PROJECTS/RESIDENTIAL/zulfiqar villa/ZFV ZULFIQARVILLA.fbx' },
  // Services
  { id: 'se7en-castle-school', label: 'Se7en Castle School (18 classes)', file: 'FBX PROJECTS/SERVICES/7 CASTLE SCHOOL/SCHOOL18CLASSES.fbx' },
  { id: 'ahl-al-bayt-mosque', label: 'Ahl Al-Bayt Mosque', file: 'FBX PROJECTS/SERVICES/AHL AL BAYT MOUSQE/AHL ALBAY TMOSQUE.fbx' },
  { id: 'ahmad-asad-garden', label: 'Ahmad Asad Garden', file: 'FBX PROJECTS/SERVICES/AHMAD ASAD GARDEN/AHMAD ASAD GARDEN.fbx' },
  { id: 'al-ghadeer-kindergarten', label: 'Al-Ghadeer Kindergarten', file: 'FBX PROJECTS/SERVICES/AL GADEER KINDERGARTEN/روضةمجمع الغدير.fbx' },
  { id: 'al-masoudi-park', label: 'Al Masoudi Park', file: 'FBX PROJECTS/SERVICES/AL MASOUDY PARK/AL MASOUDI PARK.fbx' },
  { id: 'al-muhsin-mosque', label: 'Al Muhsin Mosque', file: 'FBX PROJECTS/SERVICES/AL MUHSEN MOUSQE/ALMUHSIN MOSQUE.fbx' },
  { id: 'imam-hassan-mosque', label: 'Imam Hassan Mosque', file: 'FBX PROJECTS/SERVICES/ALHASAN MOSQUE/ALHASANMOSQUE.fbx' },
  { id: 'al-jid-mosque', label: 'Al-Jid Mosque', file: 'FBX PROJECTS/SERVICES/ALJID MOSQUE/ALJIDMOSQUE.fbx' },
  { id: 'ghadeer-karbala-mosque', label: 'Al-Ghadeer Mosque, Karbala', file: 'FBX PROJECTS/SERVICES/Al-Ghadeer mosque/جامع كربلاءالغدير.fbx' },
  { id: 'maqam-imam-sadiq', label: 'Maqam of Imam al-Sadiq', file: 'FBX PROJECTS/SERVICES/MQAAM IMAM SADIQ/مقام الائمام الصادق.fbx' },
];
