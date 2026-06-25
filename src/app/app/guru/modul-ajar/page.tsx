'use client';

import { useState, useEffect } from 'react';
import { BookOpen, Plus, Trash2, Edit3, Loader2, X, Printer, Check, Info, FileText, ChevronRight, ChevronLeft, Save } from 'lucide-react';
import { BUKU_PAKET_DATABASE } from '@/lib/bukuPaket';

interface Kelas {
  id: string;
  nama: string;
}

interface Mapel {
  id: string;
  nama: string;
  kode: string;
}

interface ModulAjar {
  id: string;
  judul: string;
  mataPelajaranId: string;
  kelasId: string | null;
  mataPelajaran: { nama: string; kode: string };
  kelas: { nama: string } | null;
  informasiUmum: any;
  komponenInti: any;
  lampiran: any;
  updatedAt: string;
}

const DIMENSI_PROFIL_LULUSAN = [
  'Beriman, Bertakwa kepada Tuhan YME, dan Berakhlak Mulia',
  'Berkebinekaan Global',
  'Gotong Royong',
  'Mandiri',
  'Bernalar Kritis',
  'Kreatif',
  'Literasi dan Numerasi Berkelanjutan',
  'Adaptif dan Berkelanjutan'
];

export default function GuruModulAjarPage() {
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [mapelList, setMapelList] = useState<Mapel[]>([]);
  const [modulList, setModulList] = useState<ModulAjar[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form Wizard State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);

  // Form Fields State
  const [judul, setJudul] = useState('');
  const [kelasId, setKelasId] = useState('');
  const [mataPelajaranId, setMataPelajaranId] = useState('');
  
  // Step 1: Informasi Umum
  const [semester, setSemester] = useState('Ganjil');
  const [alokasiWaktu, setAlokasiWaktu] = useState('2 JP (2 x 35 Menit)');
  const [kompetensiAwal, setKompetensiAwal] = useState('');
  const [saranaPrasarana, setSaranaPrasarana] = useState('');
  const [targetPeserta, setTargetPeserta] = useState('Siswa Reguler');
  const [modelPembelajaran, setModelPembelajaran] = useState('Tatap Muka / Project-Based Learning');

  // Step 2: Dimensi Profil Lulusan (Permendikdasmen 10/2025)
  const [profilLulusan, setProfilLulusan] = useState<string[]>([]);
  const [profilLulusanRealisasi, setProfilLulusanRealisasi] = useState<Record<string, string>>({});

  // Step 3: Komponen Inti
  const [tpsForMapel, setTpsForMapel] = useState<any[]>([]);
  const [selectedTpIds, setSelectedTpIds] = useState<string[]>([]);
  const [manualTpText, setManualTpText] = useState('');
  const [pemahamanBermakna, setPemahamanBermakna] = useState('');
  const [pertanyaanPemantik, setPertanyaanPemantik] = useState('');
  const [asesmenDiagnostik, setAsesmenDiagnostik] = useState('Tanya Jawab lisan sebelum KBM');
  const [asesmenFormatif, setAsesmenFormatif] = useState('Observasi keaktifan dan LKPD siswa');
  const [asesmenSumatif, setAsesmenSumatif] = useState('Penilaian hasil proyek akhir');

  // Step 4: Kegiatan Pembelajaran
  const [kegiatanPendahuluan, setKegiatanPendahuluan] = useState('');
  const [kegiatanInti, setKegiatanInti] = useState('');
  const [kegiatanPenutup, setKegiatanPenutup] = useState('');

  // Step 5: Lampiran
  const [lkpd, setLkpd] = useState('');
  const [glosarium, setGlosarium] = useState('');
  const [daftarPustaka, setDaftarPustaka] = useState('');
  const [bahanAjar, setBahanAjar] = useState('');
  const [soalAsesmen, setSoalAsesmen] = useState('');

  // AI Generator States
  const [geminiKey, setGeminiKey] = useState('');
  const [selectedTpIdForAi, setSelectedTpIdForAi] = useState('');
  const [additionalTopicForAi, setAdditionalTopicForAi] = useState('');
  const [selectedBukuPaketId, setSelectedBukuPaketId] = useState('');
  const [generatingAi, setGeneratingAi] = useState(false);
  const [showAiConfig, setShowAiConfig] = useState(false);

  // Derived helper variables for TP selection/filtering
  const usedTpIds = modulList
    .filter(m => m.id !== editingId)
    .reduce((acc: string[], m) => {
      const komp = (m.komponenInti as any) || {};
      if (Array.isArray(komp.selectedTpIds)) {
        return [...acc, ...komp.selectedTpIds];
      }
      return acc;
    }, []);

  const selectedMapel = mapelList.find(m => m.id === mataPelajaranId);
  const selectedKelas = kelasList.find(k => k.id === kelasId);
  const filteredChapters = BUKU_PAKET_DATABASE.filter(c => {
    if (!selectedMapel || !selectedKelas) return false;
    const kName = selectedKelas.nama.toLowerCase();
    const cName = c.kelas.toLowerCase();

    // Map database codes to book codes if there are mismatches
    const dbKode = selectedMapel.kode.toUpperCase();
    const bookKode = 
      (dbKode === 'PABP' || dbKode.startsWith('PAI') || dbKode.includes('PABP') || dbKode.includes('AGAMA')) ? 'PAI' : 
      dbKode === 'SB' ? 'SRI' : 
      dbKode === 'BJAW' ? 'JAWA' : 
      (dbKode === 'KAI' || dbKode === 'AI' || dbKode === 'KODING' || dbKode === 'KKAI') ? 'KAI' :
      (dbKode === 'P5' || dbKode === 'KOKU' || dbKode === 'KOKURIKULER' || dbKode === 'PROJEK') ? 'P5' :
      dbKode;

    // Special rule: P5 matches any class
    const isClassMatch = bookKode === 'P5' || (kName === cName || kName.startsWith(cName) || cName.startsWith(kName));

    return isClassMatch && c.mapelKode.toUpperCase() === bookKode;
  });

  const selectedChapter = BUKU_PAKET_DATABASE.find(c => c.id === selectedBukuPaketId);
  const chapterTpTexts = selectedChapter 
    ? selectedChapter.tujuanPembelajaranText
        .split('\n')
        .map(l => l.trim().replace(/^\d+\.\s*/, '').toLowerCase())
        .filter(l => l.length > 0)
    : [];

  const displayedTps = tpsForMapel.filter(tp => {
    // Exclude if already used in other Modul Ajar
    if (usedTpIds.includes(tp.id)) return false;

    // Filter by selected book chapter if present
    if (selectedBukuPaketId && chapterTpTexts.length > 0) {
      const descNorm = tp.deskripsi.toLowerCase();
      return chapterTpTexts.some(ctp => descNorm.includes(ctp) || ctp.includes(descNorm));
    }

    return true;
  });

  useEffect(() => {
    fetchConfigs();
  }, []);

  // Load API key from local storage when modal is opened or on start
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedKey = localStorage.getItem('gemini_api_key') || '';
      setGeminiKey(savedKey);
    }
  }, [showModal]);

  useEffect(() => {
    if (mataPelajaranId) {
      fetchTpsForMapel(mataPelajaranId, kelasId);
      
      const selectedKelas = kelasList.find(k => k.id === kelasId);
      const kName = selectedKelas?.nama || '';
      const kelasMatch = kName.match(/\d+/);
      const kelasNum = kelasMatch ? parseInt(kelasMatch[0], 10) : 1;

      const selectedMapel = mapelList.find(m => m.id === mataPelajaranId);
      const code = selectedMapel?.kode?.toUpperCase() || '';
      let jpVal = 4;
      if (code === 'IND' || code === 'INDONESIA') {
        jpVal = kelasNum <= 2 ? 7 : 6;
      } else if (code === 'MTK' || code === 'MATEMATIKA') {
        jpVal = kelasNum === 1 ? 4 : 5;
      } else if (code === 'IPAS') {
        jpVal = kelasNum <= 2 ? 0 : 5;
      } else if (code === 'PP' || code === 'PANCASILA' || code === 'PKN') {
        jpVal = 4;
      } else if (code === 'PAI' || code === 'PABP' || code === 'AGAMA' || code === 'PJOK' || code === 'OR' || code === 'SRI' || code === 'SB' || code === 'SENI') {
        jpVal = 3;
      } else if (code === 'ING' || code === 'INGGRIS' || code === 'JAWA' || code === 'BJAW' || code === 'KAI' || code === 'AI' || code === 'KODING' || code === 'KKAI') {
        jpVal = 2;
      } else if (code === 'P5' || code === 'KOKU' || code === 'KOKURIKULER' || code === 'PROJEK') {
        jpVal = 6;
      }
      setAlokasiWaktu(`${jpVal} JP (${jpVal} x 35 Menit)`);
    } else {
      setTpsForMapel([]);
    }
  }, [mataPelajaranId, mapelList, kelasId, kelasList]);

  const fetchConfigs = async () => {
    setLoading(true);
    setError('');
    try {
      const resJadwal = await fetch('/api/admin/jadwal?my=true');
      const resModul = await fetch('/api/guru/modul-ajar');

      if (!resJadwal.ok) throw new Error('Gagal mengambil data jadwal mengajar');
      if (!resModul.ok) throw new Error('Gagal mengambil data modul ajar');

      const dataJadwal = await resJadwal.json();
      const dataModul = await resModul.json();

      // Extract unique classes and subjects from teacher's schedule
      const uniqueKelasMap = new Map();
      const uniqueMapelMap = new Map();

      dataJadwal.forEach((j: any) => {
        if (j.kelas && j.kelasId) {
          uniqueKelasMap.set(j.kelasId, { id: j.kelasId, nama: j.kelas.nama });
        }
        if (j.mataPelajaran && j.mataPelajaranId) {
          uniqueMapelMap.set(j.mataPelajaranId, { 
            id: j.mataPelajaranId, 
            nama: j.mataPelajaran.nama, 
            kode: j.mataPelajaran.kode 
          });
        }
      });

      let finalKelas = Array.from(uniqueKelasMap.values());
      let finalMapel = Array.from(uniqueMapelMap.values());

      // Fallback: If teacher has no schedules assigned (e.g. admin or BK user), fetch all
      if (finalKelas.length === 0 || finalMapel.length === 0) {
        const resKelas = await fetch('/api/admin/kelas');
        const resMapel = await fetch('/api/admin/mapel');
        if (resKelas.ok) finalKelas = await resKelas.json();
        if (resMapel.ok) finalMapel = await resMapel.json();
      }

      setKelasList(finalKelas);
      setMapelList(finalMapel);
      // Sort modulList: Group by Subject and Class, then sort by Bab/Chapter order in BUKU_PAKET_DATABASE
      const sortedModulList = [...dataModul].sort((a: any, b: any) => {
        // 1. Group by Mata Pelajaran
        const mapelA = a.mataPelajaran?.nama || '';
        const mapelB = b.mataPelajaran?.nama || '';
        const mapelCompare = mapelA.localeCompare(mapelB);
        if (mapelCompare !== 0) return mapelCompare;

        // 2. Group by Kelas
        const kelasA = a.kelas?.nama || '';
        const kelasB = b.kelas?.nama || '';
        const kelasCompare = kelasA.localeCompare(kelasB);
        if (kelasCompare !== 0) return kelasCompare;

        // 3. Sort by Bab (using selectedBukuPaketId position in BUKU_PAKET_DATABASE)
        const idA = a.informasiUmum?.selectedBukuPaketId || '';
        const idB = b.informasiUmum?.selectedBukuPaketId || '';

        const indexA = BUKU_PAKET_DATABASE.findIndex(c => c.id === idA);
        const indexB = BUKU_PAKET_DATABASE.findIndex(c => c.id === idB);

        // If both are found in the database, sort by database index
        if (indexA !== -1 && indexB !== -1) {
          return indexA - indexB;
        }
        // Put those found in the DB before those that are not
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;

        // 4. Fallback to title compare or updatedAt desc
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });

      setModulList(sortedModulList);

      if (finalKelas.length > 0) setKelasId(finalKelas[0].id);
      if (finalMapel.length > 0) setMataPelajaranId(finalMapel[0].id);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat memuat data');
    } finally {
      setLoading(false);
    }
  };

  const fetchTpsForMapel = async (mapelId: string, kId?: string) => {
    try {
      const url = kId 
        ? `/api/guru/tujuan-pembelajaran?mataPelajaranId=${mapelId}&kelasId=${kId}`
        : `/api/guru/tujuan-pembelajaran?mataPelajaranId=${mapelId}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setTpsForMapel(data);
      }
    } catch (e) {
      console.error('Error fetching TPs for mapel', e);
    }
  };

  const handleAutoImportTpsForModul = async () => {
    if (!mataPelajaranId || !kelasId) {
      alert('Silakan pilih Kelas dan Mata Pelajaran terlebih dahulu.');
      return;
    }
    
    const selectedMapel = mapelList.find(m => m.id === mataPelajaranId);
    const mapelNama = selectedMapel ? selectedMapel.nama : 'Mata Pelajaran';
    
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/guru/tujuan-pembelajaran/import-buku', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mataPelajaranId,
          kelasId
        })
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 404) {
          if (confirm('Rujukan buku paket untuk mata pelajaran ini tidak ditemukan. Apakah Anda ingin membuat 3 Tujuan Pembelajaran default secara otomatis agar Modul Ajar bisa segera dibuat?')) {
            await handleCreateDefaultTpsForModul(mataPelajaranId, kelasId, mapelNama);
            return;
          }
        }
        throw new Error(data.message || 'Gagal memuat TP otomatis dari Buku Paket');
      }

      setSuccess(data.message || 'Tujuan Pembelajaran berhasil dimuat!');
      await fetchTpsForMapel(mataPelajaranId, kelasId);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat TP otomatis');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateDefaultTpsForModul = async (mId: string, kId: string, mNama: string) => {
    try {
      const selectedMapel = mapelList.find(m => m.id === mId);
      const code = selectedMapel?.kode?.toUpperCase() || '';
      let defaultJP = 4;
      if (code === 'KODING' || code === 'KAI' || code === 'AI' || code === 'KKAI') {
        defaultJP = 2;
      } else if (code === 'P5' || code === 'KOKU' || code === 'KOKURIKULER' || code === 'PROJEK') {
        defaultJP = 6;
      }

      const genericTps = [
        { deskripsi: `Memahami dan mengidentifikasi konsep dasar materi Bab I pada mata pelajaran ${mNama}`, alokasiJP: defaultJP, kktp: 70, semester: 1 },
        { deskripsi: `Melakukan eksplorasi praktis dan studi kasus Bab II pada mata pelajaran ${mNama}`, alokasiJP: defaultJP, kktp: 70, semester: 1 },
        { deskripsi: `Mengevaluasi hasil pembelajaran dan merangkum inti Bab III pada mata pelajaran ${mNama}`, alokasiJP: defaultJP, kktp: 70, semester: 1 }
      ];

      let createdCount = 0;
      for (const tp of genericTps) {
        const res = await fetch('/api/guru/tujuan-pembelajaran', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mataPelajaranId: mId,
            kelasId: kId,
            deskripsi: tp.deskripsi,
            kktp: tp.kktp,
            alokasiJP: tp.alokasiJP,
            semester: tp.semester
          })
        });
        if (res.ok) createdCount++;
      }

      setSuccess(`Berhasil membuat ${createdCount} Tujuan Pembelajaran default untuk ${mNama}!`);
      await fetchTpsForMapel(mId, kId);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setError('Gagal membuat Tujuan Pembelajaran default');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setJudul('');
    if (kelasList.length > 0) setKelasId(kelasList[0].id);
    if (mapelList.length > 0) setMataPelajaranId(mapelList[0].id);
    
    setSemester('Ganjil');
    setAlokasiWaktu('2 JP (2 x 35 Menit)');
    setKompetensiAwal('');
    setSaranaPrasarana('');
    setTargetPeserta('Siswa Reguler');
    setModelPembelajaran('Tatap Muka / Project-Based Learning');
    setProfilLulusan([...DIMENSI_PROFIL_LULUSAN]);
    setProfilLulusanRealisasi({
      "Beriman, Bertakwa kepada Tuhan YME, dan Berakhlak Mulia": "Diwujudkan melalui kegiatan berdoa sebelum dan sesudah belajar.",
      "Berkebinekaan Global": "Diwujudkan melalui sikap toleransi menghargai pendapat dalam diskusi kelompok.",
      "Gotong Royong": "Diwujudkan melalui kolaborasi bersama dalam mengerjakan tugas kelompok.",
      "Mandiri": "Diwujudkan melalui tanggung jawab menyelesaikan tugas mandiri.",
      "Bernalar Kritis": "Diwujudkan melalui pengerjaan LKPD pemecahan masalah.",
      "Kreatif": "Diwujudkan melalui penyusunan presentasi orisinal hasil kerja.",
      "Literasi dan Numerasi Berkelanjutan": "Diwujudkan melalui pemahaman teks bacaan dan grafik matematika.",
      "Adaptif dan Berkelanjutan": "Diwujudkan melalui pemanfaatan sumber belajar baru dan kepedulian lingkungan."
    });
    setSelectedTpIds([]);
    setManualTpText('');
    setPemahamanBermakna('');
    setPertanyaanPemantik('');
    setAsesmenDiagnostik('Tanya Jawab lisan sebelum KBM');
    setAsesmenFormatif('Observasi keaktifan dan LKPD siswa');
    setAsesmenSumatif('Penilaian hasil proyek akhir');
    setKegiatanPendahuluan('');
    setKegiatanInti('');
    setKegiatanPenutup('');
    setLkpd('');
    setGlosarium('');
    setDaftarPustaka('');
    setBahanAjar('');
    setSoalAsesmen('');
    setSelectedBukuPaketId('');
    setSelectedTpIdForAi('');
    setAdditionalTopicForAi('');

    setCurrentStep(1);
    setError('');
    setShowModal(true);
  };

  const handleOpenEdit = (item: ModulAjar) => {
    setEditingId(item.id);
    setJudul(item.judul);
    setKelasId(item.kelasId || '');
    setMataPelajaranId(item.mataPelajaranId);

    const info = item.informasiUmum || {};
    setSemester(info.semester || 'Ganjil');
    setAlokasiWaktu(info.alokasiWaktu || '2 JP (2 x 35 Menit)');
    setKompetensiAwal(info.kompetensiAwal || '');
    setSaranaPrasarana(info.saranaPrasarana || '');
    setTargetPeserta(info.targetPeserta || 'Siswa Reguler');
    setModelPembelajaran(info.modelPembelajaran || 'Tatap Muka / Project-Based Learning');
    setProfilLulusan(info.profilLulusan || []);
    setProfilLulusanRealisasi(info.profilLulusanRealisasi || {});
    setSelectedBukuPaketId(info.selectedBukuPaketId || '');

    const komp = item.komponenInti || {};
    setManualTpText(komp.tujuanPembelajaran || '');
    setPemahamanBermakna(komp.pemahamanBermakna || '');
    setPertanyaanPemantik(komp.pertanyaanPemantik || '');
    setAsesmenDiagnostik(komp.asesmenDiagnostik || 'Tanya Jawab lisan sebelum KBM');
    setAsesmenFormatif(komp.asesmenFormatif || 'Observasi keaktifan dan LKPD siswa');
    setAsesmenSumatif(komp.asesmenSumatif || 'Penilaian hasil proyek akhir');
    setKegiatanPendahuluan(komp.kegiatanPendahuluan || '');
    setKegiatanInti(komp.kegiatanInti || '');
    setKegiatanPenutup(komp.kegiatanPenutup || '');
    setSelectedTpIds(komp.selectedTpIds || []);

    const lamp = item.lampiran || {};
    setLkpd(lamp.lkpd || '');
    setGlosarium(lamp.glosarium || '');
    setDaftarPustaka(lamp.daftarPustaka || '');
    setBahanAjar(lamp.bahanAjar || '');
    setSoalAsesmen(lamp.soalAsesmen || '');
    setSelectedTpIdForAi('');
    setAdditionalTopicForAi('');

    setCurrentStep(1);
    setError('');
    setShowModal(true);
  };

  const handleProfilLulusanChange = (dimensi: string, checked: boolean) => {
    if (checked) {
      setProfilLulusan(prev => [...prev, dimensi]);
    } else {
      setProfilLulusan(prev => prev.filter(d => d !== dimensi));
    }
  };

  const handleTpCheckboxChange = (tpId: string, tpDesc: string, checked: boolean) => {
    let nextIds = [];
    if (checked) {
      nextIds = [...selectedTpIds, tpId];
    } else {
      nextIds = selectedTpIds.filter(id => id !== tpId);
    }
    setSelectedTpIds(nextIds);

    // Otomatis update teks deskripsi TP komponen inti
    const selectedDescriptions = tpsForMapel
      .filter(tp => nextIds.includes(tp.id))
      .map((tp, idx) => `${idx + 1}. ${tp.deskripsi}`)
      .join('\n');
    setManualTpText(selectedDescriptions);
  };

  const handleGenerateAi = async () => {
    if (!selectedTpIdForAi && !additionalTopicForAi.trim() && !selectedBukuPaketId) {
      alert('Silakan pilih salah satu Tujuan Pembelajaran (TP), ketik topik tambahan, atau pilih rujukan bab buku paket.');
      return;
    }

    setGeneratingAi(true);
    setError('');
    try {
      const key = geminiKey || localStorage.getItem('gemini_api_key') || '';
      const res = await fetch('/api/guru/modul-ajar/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tujuanPembelajaranId: selectedTpIdForAi,
          mataPelajaranId,
          kelasId,
          topik: additionalTopicForAi,
          bukuPaketChapterId: selectedBukuPaketId,
          apiKey: key
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Gagal generate modul ajar dengan AI');
      }

      // Populate form states
      if (data.judul) setJudul(data.judul);
      if (data.semester) setSemester(data.semester);
      if (data.alokasiWaktu) setAlokasiWaktu(data.alokasiWaktu);
      if (data.kompetensiAwal) setKompetensiAwal(data.kompetensiAwal);
      if (data.saranaPrasarana) setSaranaPrasarana(data.saranaPrasarana);
      if (data.targetPeserta) setTargetPeserta(data.targetPeserta);
      if (data.modelPembelajaran) setModelPembelajaran(data.modelPembelajaran);
      
      if (data.profilLulusan && Array.isArray(data.profilLulusan)) {
        setProfilLulusan(data.profilLulusan);
      }
      if (data.profilLulusanRealisasi) {
        setProfilLulusanRealisasi(data.profilLulusanRealisasi);
      }
      
      if (data.tujuanPembelajaranText) setManualTpText(data.tujuanPembelajaranText);
      if (data.pemahamanBermakna) setPemahamanBermakna(data.pemahamanBermakna);
      if (data.pertanyaanPemantik) setPertanyaanPemantik(data.pertanyaanPemantik);
      
      if (data.asesmenDiagnostik) setAsesmenDiagnostik(data.asesmenDiagnostik);
      if (data.asesmenFormatif) setAsesmenFormatif(data.asesmenFormatif);
      if (data.asesmenSumatif) setAsesmenSumatif(data.asesmenSumatif);
      
      if (data.kegiatanPendahuluan) setKegiatanPendahuluan(data.kegiatanPendahuluan);
      if (data.kegiatanInti) setKegiatanInti(data.kegiatanInti);
      if (data.kegiatanPenutup) setKegiatanPenutup(data.kegiatanPenutup);
      
      if (data.lkpd) setLkpd(data.lkpd);
      if (data.glosarium) setGlosarium(data.glosarium);
      if (data.daftarPustaka) setDaftarPustaka(data.daftarPustaka);
      if (data.bahanAjar) setBahanAjar(data.bahanAjar);
      if (data.soalAsesmen) setSoalAsesmen(data.soalAsesmen);

      // Otomatis centang TP jika dipilih
      if (selectedTpIdForAi) {
        setSelectedTpIds([selectedTpIdForAi]);
      }

      alert('Berhasil! Seluruh form Modul Ajar telah diisi secara otomatis oleh AI. Silakan periksa di setiap langkah wizard.');
      setShowAiConfig(false);
    } catch (err: any) {
      setError(err.message || 'Gagal generate modul ajar dengan AI');
      alert('Gagal: ' + (err.message || 'Gagal generate modul ajar dengan AI'));
    } finally {
      setGeneratingAi(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!judul || !mataPelajaranId) {
      setError('Judul dan Mata Pelajaran wajib diisi');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    const informasiUmum = {
      semester,
      alokasiWaktu,
      kompetensiAwal,
      saranaPrasarana,
      targetPeserta,
      modelPembelajaran,
      profilLulusan,
      profilLulusanRealisasi,
      selectedBukuPaketId
    };

    const komponenInti = {
      selectedTpIds,
      tujuanPembelajaran: manualTpText,
      pemahamanBermakna,
      pertanyaanPemantik,
      kegiatanPendahuluan,
      kegiatanInti,
      kegiatanPenutup,
      asesmenDiagnostik,
      asesmenFormatif,
      asesmenSumatif
    };

    const lampiran = {
      lkpd,
      glosarium,
      daftarPustaka,
      bahanAjar,
      soalAsesmen
    };

    try {
      const url = '/api/guru/modul-ajar';
      const method = editingId ? 'POST' : 'POST'; // POST handles both create (no id) and update (with id)
      const body = {
        id: editingId || undefined,
        judul,
        kelasId: kelasId || null,
        mataPelajaranId,
        informasiUmum,
        komponenInti,
        lampiran
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal menyimpan modul ajar');

      setSuccess(editingId ? 'Modul ajar berhasil diperbarui' : 'Modul ajar berhasil dibuat');
      setShowModal(false);
      fetchConfigs();
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan modul ajar');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus modul ajar ini?')) return;
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`/api/guru/modul-ajar?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal menghapus modul ajar');

      setSuccess('Modul ajar berhasil dihapus');
      fetchConfigs();
    } catch (err: any) {
      setError(err.message || 'Gagal menghapus modul ajar');
    }
  };

  return (
    <div className="space-y-6 flex-1 flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2 select-none">
            <BookOpen className="text-indigo-400" />
            Dasbor Modul Ajar (RPP Plus)
          </h1>
          <p className="text-slate-400 mt-1 text-xs">Penyusunan Modul Ajar Kurikulum Merdeka Terintegrasi & Siap Cetak.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-xs shadow-lg shadow-indigo-500/20 transition-all cursor-pointer w-full sm:w-auto justify-center"
        >
          <Plus size={14} />
          Buat Modul Ajar Baru
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-2xl text-xs font-semibold select-none">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded-2xl text-xs font-semibold select-none">
          {checkIcon}
          {success}
        </div>
      )}

      {/* List Modul Ajar */}
      {loading ? (
        <div className="flex justify-center items-center py-20 flex-1">
          <Loader2 className="animate-spin text-indigo-400" size={28} />
        </div>
      ) : modulList.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-12 text-center my-auto">
          <FileText className="mx-auto text-slate-700 mb-3" size={40} />
          <p className="text-slate-400 text-sm font-semibold">Belum ada modul ajar yang dibuat. Mulai buat dengan menekan tombol di atas.</p>
        </div>
      ) : (() => {
        interface GroupedModul {
          key: string;
          label: string;
          list: ModulAjar[];
        }

        const groups: GroupedModul[] = [];
        modulList.forEach((item) => {
          const mapelName = item.mataPelajaran.nama;
          const mapelKode = item.mataPelajaran.kode;
          const kelasName = item.kelas ? item.kelas.nama : 'Semua Kelas';
          const key = `${item.mataPelajaranId}-${item.kelasId || 'none'}`;
          
          let group = groups.find(g => g.key === key);
          if (!group) {
            group = {
              key,
              label: `${mapelName} (${mapelKode}) • ${kelasName}`,
              list: []
            };
            groups.push(group);
          }
          group.list.push(item);
        });

        return (
          <div className="space-y-8">
            {groups.map((group) => (
              <div key={group.key} className="space-y-4">
                {/* Group Header */}
                <div className="flex items-center gap-3 pb-2 border-b border-slate-800/60">
                  <div className="h-5 w-1 bg-indigo-500 rounded-full"></div>
                  <h3 className="text-xs font-bold text-slate-200 tracking-wide flex items-center gap-2 select-none">
                    {group.label}
                    <span className="px-2 py-0.5 text-[9px] bg-slate-850 border border-slate-800 text-slate-400 rounded-full font-bold">
                      {group.list.length} Modul
                    </span>
                  </h3>
                </div>

                {/* Group Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {group.list.map((item) => (
                    <div
                      key={item.id}
                      className="bg-slate-900 border border-slate-850 rounded-2xl p-5 space-y-3 shadow-md hover:border-slate-800 transition-all flex flex-col justify-between"
                    >
                      <div className="space-y-1">
                        <div className="text-[10px] font-bold text-indigo-400">
                          {item.mataPelajaran.nama} ({item.mataPelajaran.kode}) {item.kelas ? `• ${item.kelas.nama}` : ''}
                        </div>
                        <h4 className="text-sm font-bold text-slate-200">{item.judul}</h4>
                        <p className="text-[9px] text-slate-500 font-semibold">
                          Terakhir Diperbarui: {new Date(item.updatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="flex gap-2 justify-end pt-3 border-t border-slate-850/60">
                        <a
                          href={`/cetak-modul?id=${item.id}`}
                          className="px-3 py-1.5 bg-slate-950/60 border border-slate-850 hover:bg-slate-800 text-slate-350 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition-all"
                        >
                          <Printer size={12} /> Cetak Rapi
                        </a>
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="px-3 py-1.5 bg-slate-950 border border-slate-850 hover:bg-slate-800 text-indigo-400 hover:text-indigo-300 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <Edit3 size={12} /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 bg-slate-950 border border-slate-850 hover:bg-rose-950/20 text-slate-500 hover:text-rose-450 rounded-xl transition-all cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );
      })()}

      {/* Steps Wizard Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header Modal */}
            <div className="p-5 border-b border-slate-800 flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <BookOpen className="text-indigo-400" size={18} />
                  {editingId ? 'Edit Modul Ajar' : 'Susun Modul Ajar Baru'}
                </h2>
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">Langkah {currentStep} dari 5</div>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
                <X size={18} />
              </button>
            </div>

            {/* Step Indicators Bar */}
            <div className="flex bg-slate-950/30 px-5 py-2 border-b border-slate-850/60 justify-between items-center text-[9px] font-bold text-slate-500 uppercase tracking-wider select-none shrink-0">
              <span className={currentStep >= 1 ? 'text-indigo-400' : ''}>1. Identitas</span>
              <ChevronRight size={10} />
              <span className={currentStep >= 2 ? 'text-indigo-400' : ''}>2. Profil Lulusan</span>
              <ChevronRight size={10} />
              <span className={currentStep >= 3 ? 'text-indigo-400' : ''}>3. Inti & Asesmen</span>
              <ChevronRight size={10} />
              <span className={currentStep >= 4 ? 'text-indigo-400' : ''}>4. Langkah KBM</span>
              <ChevronRight size={10} />
              <span className={currentStep >= 5 ? 'text-indigo-400' : ''}>5. Lampiran</span>
            </div>

            {/* Form Content Scrollable */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
              
              {/* STEP 1: IDENTITAS & INFORMASI UMUM */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  {/* Pilih Mata Pelajaran & Pilih Kelas (Di Paling Atas) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pilih Mata Pelajaran</label>
                      <select
                        value={mataPelajaranId}
                        onChange={(e) => setMataPelajaranId(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-white text-xs focus:outline-hidden focus:border-indigo-500 font-medium"
                      >
                        {mapelList.map((m) => (
                          <option key={m.id} value={m.id}>{m.nama} ({m.kode})</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pilih Kelas</label>
                      <select
                        value={kelasId}
                        onChange={(e) => setKelasId(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-white text-xs focus:outline-hidden focus:border-indigo-500 font-medium"
                      >
                        {kelasList.map((k) => (
                          <option key={k.id} value={k.id}>{k.nama}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Rujukan Buku Paket (Bab)</label>
                    <select
                      value={selectedBukuPaketId}
                      onChange={(e) => setSelectedBukuPaketId(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-white text-xs focus:outline-hidden focus:border-indigo-500 font-medium"
                    >
                      <option value="">-- Tampilkan Semua Bab & TP --</option>
                      {filteredChapters.map((ch) => {
                        const chTps = ch.tujuanPembelajaranText
                          .split('\n')
                          .map(l => l.trim().replace(/^\d+\.\s*/, ''))
                          .filter(l => l.length > 0);
                        const matchingTps = tpsForMapel.filter(tp => 
                          chTps.some(ctp => tp.deskripsi.toLowerCase().includes(ctp.toLowerCase()) || ctp.toLowerCase().includes(tp.deskripsi.toLowerCase()))
                        );
                        const unusedMatchingTps = matchingTps.filter(tp => !usedTpIds.includes(tp.id));
                        const countLabel = matchingTps.length > 0 
                          ? `(${unusedMatchingTps.length}/${matchingTps.length} TP Tersisa)` 
                          : '';
                        return (
                          <option key={ch.id} value={ch.id}>
                            {ch.judulBab} {countLabel}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* AI Generator Panel */}
                  {(() => {
                    return (
                      <div className="bg-indigo-950/25 border border-indigo-500/25 p-4 rounded-2xl space-y-4">
                        <h4 className="text-[10px] font-extrabold text-indigo-400 flex items-center gap-1.5 uppercase">
                          🤖 Pembuat Modul Ajar Otomatis (AI & Template Cepat)
                        </h4>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-bold text-slate-400 uppercase">1. Pilih Tujuan Pembelajaran (TP)</label>
                            <select
                              value={selectedTpIdForAi}
                              onChange={(e) => setSelectedTpIdForAi(e.target.value)}
                              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-white text-xs focus:outline-hidden focus:border-indigo-500 font-medium"
                            >
                              <option value="">-- Pilih TP dari Prota --</option>
                              {displayedTps.map((tp) => (
                                <option key={tp.id} value={tp.id}>
                                  {tp.deskripsi.length > 40 ? `${tp.deskripsi.substring(0, 40)}...` : tp.deskripsi}
                                </option>
                              ))}
                            </select>
                            {displayedTps.length === 0 && (
                              <button
                                type="button"
                                onClick={handleAutoImportTpsForModul}
                                className="text-[10px] text-indigo-400 hover:text-indigo-350 font-bold underline cursor-pointer mt-1 block"
                              >
                                🤖 Klik untuk isi TP otomatis (Buku / Default)
                              </button>
                            )}
                          </div>
                          
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-bold text-slate-400 uppercase">2. Topik Tambahan (Opsional)</label>
                            <input
                              type="text"
                              value={additionalTopicForAi}
                              onChange={(e) => setAdditionalTopicForAi(e.target.value)}
                              placeholder="Misal: Bab 3 halaman 45"
                              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-white text-xs focus:outline-hidden focus:border-indigo-500 font-medium"
                            />
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-1">
                          <button
                            type="button"
                            onClick={() => setShowAiConfig(!showAiConfig)}
                            className="text-[9px] text-slate-500 hover:text-slate-400 underline cursor-pointer"
                          >
                            {showAiConfig ? 'Tutup Pengaturan API Key' : 'Pengaturan API Key Gemini (Opsional)'}
                          </button>

                          <button
                            type="button"
                            disabled={generatingAi}
                            onClick={handleGenerateAi}
                            className="px-4 py-2.5 bg-indigo-650 hover:bg-indigo-600 disabled:bg-indigo-600/50 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-indigo-950"
                          >
                            {generatingAi ? <Loader2 size={13} className="animate-spin text-white" /> : '🤖'}
                            {generatingAi ? 'Sedang Menulis Modul...' : 'Mulai Isi Otomatis'}
                          </button>
                        </div>

                        {showAiConfig && (
                          <div className="space-y-1 pt-3 border-t border-slate-850">
                            <label className="text-[9px] font-bold text-slate-400 uppercase">API Key Gemini Anda</label>
                            <input
                              type="password"
                              value={geminiKey}
                              onChange={(e) => {
                                setGeminiKey(e.target.value);
                                localStorage.setItem('gemini_api_key', e.target.value);
                              }}
                              placeholder="AIzaSy..."
                              className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-white text-xs focus:outline-hidden focus:border-indigo-500"
                            />
                            <p className="text-[8px] text-slate-500">API Key disimpan secara lokal di browser Anda. Jika kosong, sistem menggunakan template offline server secara otomatis.</p>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Judul Modul Ajar</label>
                    <input
                      type="text"
                      value={judul}
                      onChange={(e) => setJudul(e.target.value)}
                      placeholder="Contoh: Modul Ajar Matematika - Pembagian Pecahan"
                      className="w-full px-3 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-white text-xs focus:outline-hidden focus:border-indigo-500 font-semibold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Semester</label>
                      <select
                        value={semester}
                        onChange={(e) => setSemester(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-white text-xs focus:outline-hidden"
                      >
                        <option value="Ganjil">Semester I (Ganjil)</option>
                        <option value="Genap">Semester II (Genap)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Alokasi Waktu</label>
                      <input
                        type="text"
                        value={alokasiWaktu}
                        onChange={(e) => setAlokasiWaktu(e.target.value)}
                        placeholder="Contoh: 2 JP (2 x 35 Menit)"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-white text-xs focus:outline-hidden focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Kompetensi Awal (Kemampuan Prasyarat Siswa)</label>
                    <textarea
                      value={kompetensiAwal}
                      onChange={(e) => setKompetensiAwal(e.target.value)}
                      placeholder="Contoh: Siswa sudah memahami konsep perkalian bilangan cacah dasar..."
                      rows={2}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-white text-xs focus:outline-hidden focus:border-indigo-500 resize-none leading-relaxed"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sarana & Prasarana</label>
                    <input
                      type="text"
                      value={saranaPrasarana}
                      onChange={(e) => setSaranaPrasarana(e.target.value)}
                      placeholder="Contoh: Laptop, LCD Proyektor, Internet, Buku Paket, LKPD..."
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-white text-xs focus:outline-hidden"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Target Peserta Didik</label>
                      <input
                        type="text"
                        value={targetPeserta}
                        onChange={(e) => setTargetPeserta(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-white text-xs focus:outline-hidden"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Model Pembelajaran</label>
                      <input
                        type="text"
                        value={modelPembelajaran}
                        onChange={(e) => setModelPembelajaran(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-white text-xs focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: 8 DIMENSI PROFIL LULUSAN (PERMENDIKDASMEN 10/2025) */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="p-4 bg-indigo-950/30 border border-indigo-900/40 rounded-2xl text-[10px] text-indigo-350 leading-relaxed">
                    <span className="font-bold flex items-center gap-1 uppercase mb-1">
                      <Info size={12} /> Regulasi SKL Baru: Permendikdasmen No. 10/2025
                    </span>
                    Berdasarkan standar kelulusan terbaru dari kementerian, pilih satu atau lebih dimensi profil lulusan yang akan dikembangkan dalam modul ajar ini:
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {DIMENSI_PROFIL_LULUSAN.map((dimensi) => {
                      const isChecked = profilLulusan.includes(dimensi);
                      return (
                        <div
                          key={dimensi}
                          className={`flex flex-col p-3 rounded-2xl border transition-all ${
                            isChecked 
                              ? 'bg-indigo-950/20 border-indigo-500/50 text-white' 
                              : 'bg-slate-950/20 border-slate-850 text-slate-450 hover:border-slate-800'
                          }`}
                        >
                          <label className="flex items-start cursor-pointer select-none w-full">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                handleProfilLulusanChange(dimensi, e.target.checked);
                                if (e.target.checked && !profilLulusanRealisasi[dimensi]) {
                                  const defaultRealisasiDesc: Record<string, string> = {
                                    "Beriman, Bertakwa kepada Tuhan YME, dan Berakhlak Mulia": "Diwujudkan melalui kegiatan berdoa sebelum dan sesudah belajar.",
                                    "Berkebinekaan Global": "Diwujudkan melalui sikap toleransi menghargai pendapat dalam diskusi kelompok.",
                                    "Gotong Royong": "Diwujudkan melalui kolaborasi bersama dalam mengerjakan tugas kelompok.",
                                    "Mandiri": "Diwujudkan melalui tanggung jawab menyelesaikan tugas mandiri.",
                                    "Bernalar Kritis": "Diwujudkan melalui pengerjaan LKPD pemecahan masalah.",
                                    "Kreatif": "Diwujudkan melalui penyusunan presentasi orisinal hasil kerja.",
                                    "Literasi dan Numerasi Berkelanjutan": "Diwujudkan melalui pemahaman teks bacaan dan grafik matematika.",
                                    "Adaptif dan Berkelanjutan": "Diwujudkan melalui pemanfaatan sumber belajar baru dan kepedulian lingkungan."
                                  };
                                  setProfilLulusanRealisasi(prev => ({
                                    ...prev,
                                    [dimensi]: defaultRealisasiDesc[dimensi] || "Diwujudkan melalui aktivitas pembelajaran."
                                  }));
                                }
                              }}
                              className="mt-0.5 rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-0 focus:ring-offset-0 shrink-0"
                            />
                            <span className="ml-3 text-xs font-semibold leading-tight">{dimensi}</span>
                          </label>
                          {isChecked && (
                            <div className="mt-2 pl-7">
                              <textarea
                                value={profilLulusanRealisasi[dimensi] || ''}
                                onChange={(e) => setProfilLulusanRealisasi(prev => ({ ...prev, [dimensi]: e.target.value }))}
                                placeholder="Diwujudkan melalui..."
                                rows={2}
                                className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-850 rounded-lg text-white text-[10px] focus:outline-hidden focus:border-indigo-500 font-medium resize-none leading-relaxed"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 3: KOMPONEN INTI (TP, PEMAHAMAN BERMAKNA, PEMANTIK, ASESMEN) */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  {/* Ceklis TP Otomatis */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Hubungkan Dengan Tujuan Pembelajaran (Prota)</label>
                    {displayedTps.length === 0 ? (
                      <p className="text-[10px] text-slate-500 italic">
                        {tpsForMapel.length === 0 ? (
                          <span>
                            Belum ada TP terdaftar di Prota untuk mata pelajaran ini.{' '}
                            <button
                              type="button"
                              onClick={handleAutoImportTpsForModul}
                              className="text-indigo-400 hover:text-indigo-350 font-bold underline cursor-pointer inline ml-1"
                            >
                              Buat TP Otomatis (Buku / Default)
                            </button>
                          </span>
                        ) : (
                          'Semua TP untuk Bab ini sudah selesai disusun menjadi Modul Ajar.'
                        )}
                      </p>
                    ) : (
                      <div className="max-h-32 overflow-y-auto border border-slate-850 p-2.5 rounded-xl space-y-2 bg-slate-950/30">
                        {displayedTps.map((tp) => {
                          const isChecked = selectedTpIds.includes(tp.id);
                          return (
                            <label key={tp.id} className="flex items-start gap-2 text-xs text-slate-350 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => handleTpCheckboxChange(tp.id, tp.deskripsi, e.target.checked)}
                                className="mt-0.5 rounded border-slate-800 text-indigo-600 focus:ring-0"
                              />
                              <span className="leading-snug">{tp.deskripsi} (S{tp.semester} - {tp.alokasiJP}JP)</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Teks Deskripsi Tujuan Pembelajaran (Di Modul)</label>
                    <textarea
                      value={manualTpText}
                      onChange={(e) => setManualTpText(e.target.value)}
                      placeholder="Pilih dari ceklis di atas atau ketik manual tujuan pembelajaran di sini..."
                      rows={3}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-white text-xs focus:outline-hidden focus:border-indigo-500 resize-none leading-relaxed"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pemahaman Bermakna (Manfaat Pembelajaran)</label>
                    <textarea
                      value={pemahamanBermakna}
                      onChange={(e) => setPemahamanBermakna(e.target.value)}
                      placeholder="Contoh: Dengan memahami pecahan, siswa dapat membagi makanan atau benda sama besar..."
                      rows={2}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-white text-xs focus:outline-hidden focus:border-indigo-500 resize-none leading-relaxed"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pertanyaan Pemantik (Tulis per baris)</label>
                    <textarea
                      value={pertanyaanPemantik}
                      onChange={(e) => setPertanyaanPemantik(e.target.value)}
                      placeholder="Bagaimana cara membagi kue untuk 4 orang?&#10;Apakah pecahan itu selalu lebih kecil dari 1?"
                      rows={2}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-white text-xs focus:outline-hidden focus:border-indigo-500 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Asesmen Diagnostik</label>
                      <input type="text" value={asesmenDiagnostik} onChange={(e) => setAsesmenDiagnostik(e.target.value)} className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-white text-xs focus:outline-hidden" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Asesmen Formatif</label>
                      <input type="text" value={asesmenFormatif} onChange={(e) => setAsesmenFormatif(e.target.value)} className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-white text-xs focus:outline-hidden" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Asesmen Sumatif</label>
                      <input type="text" value={asesmenSumatif} onChange={(e) => setAsesmenSumatif(e.target.value)} className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-white text-xs focus:outline-hidden" />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: KEGIATAN PEMBELAJARAN (PENDAHULUAN, INTI, PENUTUP) */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Kegiatan Pendahuluan</label>
                    <textarea
                      value={kegiatanPendahuluan}
                      onChange={(e) => setKegiatanPendahuluan(e.target.value)}
                      placeholder="1. Orientasi: Guru membuka salam...&#10;2. Apersepsi: Guru menguji pemahaman...&#10;3. Motivasi: Menjelaskan tujuan belajar..."
                      rows={3}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-white text-xs focus:outline-hidden focus:border-indigo-500 resize-none leading-relaxed"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Kegiatan Inti (Skenario Utama Pembelajaran)</label>
                    <textarea
                      value={kegiatanInti}
                      onChange={(e) => setKegiatanInti(e.target.value)}
                      placeholder="1. Siswa membentuk kelompok...&#10;2. Guru membagikan LKPD...&#10;3. Siswa berdiskusi memecahkan masalah..."
                      rows={5}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-white text-xs focus:outline-hidden focus:border-indigo-500 resize-none leading-relaxed"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Kegiatan Penutup</label>
                    <textarea
                      value={kegiatanPenutup}
                      onChange={(e) => setKegiatanPenutup(e.target.value)}
                      placeholder="1. Siswa dibimbing merangkum kesimpulan...&#10;2. Guru melakukan evaluasi singkat...&#10;3. Berdoa bersama dan salam penutup..."
                      rows={3}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-white text-xs focus:outline-hidden focus:border-indigo-500 resize-none leading-relaxed"
                    />
                  </div>
                </div>
              )}

              {/* STEP 5: LAMPIRAN (LKPD, GLOSARIUM, DAFTAR PUSTAKA) */}
              {currentStep === 5 && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Materi Ajar (Materi Lengkap Pembelajaran Siswa)</label>
                    <textarea
                      value={bahanAjar}
                      onChange={(e) => setBahanAjar(e.target.value)}
                      placeholder="Uraian materi ajar lengkap berisi penjelasan konsep, definisi, dan contoh soal..."
                      rows={5}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-white text-xs focus:outline-hidden focus:border-indigo-500 resize-none leading-relaxed"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Lembar Kerja Peserta Didik (LKPD - Judul, Tujuan, Skenario, Langkah, Tugas, Kunci)</label>
                    <textarea
                      value={lkpd}
                      onChange={(e) => setLkpd(e.target.value)}
                      placeholder="Soal Latihan Kelompok:&#10;1. Selesaikan penjumlahan pecahan berikut...&#10;2. Tuliskan kesimpulan kelompok Anda..."
                      rows={4}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-white text-xs focus:outline-hidden focus:border-indigo-500 resize-none leading-relaxed"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Soal Asesmen & Rubrik Penilaian (Lengkap dengan Kunci Jawaban)</label>
                    <textarea
                      value={soalAsesmen}
                      onChange={(e) => setSoalAsesmen(e.target.value)}
                      placeholder="Contoh Asesmen:&#10;1. Pilihan Ganda / Isian Singkat...&#10;2. Rubrik Penilaian Sikap/Kinerja...&#10;3. Kunci Jawaban & Kriteria Ketuntasan..."
                      rows={4}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-white text-xs focus:outline-hidden focus:border-indigo-500 resize-none leading-relaxed"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Glosarium (Daftar Istilah Sulit)</label>
                    <textarea
                      value={glosarium}
                      onChange={(e) => setGlosarium(e.target.value)}
                      placeholder="Pecahan: Bilangan yang menyatakan bagian dari sesuatu yang utuh..."
                      rows={2}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-white text-xs focus:outline-hidden focus:border-indigo-500 resize-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Daftar Pustaka</label>
                    <textarea
                      value={daftarPustaka}
                      onChange={(e) => setDaftarPustaka(e.target.value)}
                      placeholder="Buku Guru Matematika SD Kelas V, Kemendikdasmen, 2025..."
                      rows={2}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-white text-xs focus:outline-hidden focus:border-indigo-500 resize-none"
                    />
                  </div>
                </div>
              )}

              {/* Wizard Bottom Buttons Navigation */}
              <div className="flex justify-between items-center pt-4 border-t border-slate-850 shrink-0">
                <div>
                  {currentStep > 1 && (
                    <button
                      type="button"
                      onClick={() => setCurrentStep(prev => prev - 1)}
                      className="py-2.5 px-4 bg-slate-850 hover:bg-slate-800 text-slate-350 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <ChevronLeft size={14} /> Sebelumnya
                    </button>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="py-2.5 px-4 bg-slate-950/20 hover:bg-slate-950/40 text-slate-500 rounded-xl text-xs font-semibold cursor-pointer border border-slate-850"
                  >
                    Batal
                  </button>
                  {currentStep < 5 ? (
                    <button
                      type="button"
                      onClick={() => setCurrentStep(prev => prev + 1)}
                      className="py-2.5 px-4 bg-slate-800 hover:bg-slate-750 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                    >
                      Berikutnya <ChevronRight size={14} />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={submitting}
                      className="py-2.5 px-5 bg-linear-to-r from-indigo-500 to-violet-650 hover:from-indigo-600 hover:to-violet-750 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {submitting ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                      {editingId ? 'Simpan Perubahan' : 'Terbitkan Modul'}
                    </button>
                  )}
                </div>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const checkIcon = (
  <svg className="w-4 h-4 text-emerald-400 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);
