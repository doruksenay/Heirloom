import type { ChoiceDef, Ctx, EventDef } from '../types';
import { MAJOR_IDS, MAJOR_INFO, majorOf, setMajor, type MajorId } from '../../engine/careers';

/**
 * Round 5: a field of study for every graduate, free game included (review 5 §3.3: a law graduate became a
 * dental intern). The major is chosen in the first year at university; in Türkiye the YKS tercih sets it
 * before that (culture-tr calls setMajor), so this event only fills the gap. Gated jobs: careers.ts JOB_MAJORS.
 */
export const MAJOR_LINES: Record<MajorId, [string, string]> = {
  engineering: ['You chose Engineering. You now own a calculator that costs more than your phone.', 'Mühendislik seçtin. Artık telefonundan pahalı bir hesap makinen var.'],
  medicine: ['You chose Medicine. Your relatives already ask you about their knee pain.', 'Tıp seçtin. Akrabalar şimdiden diz ağrılarını sana danışmaya başladı.'],
  dentistry: ['You chose Dentistry. Everyone you meet now smiles at you with their mouth closed.', 'Diş Hekimliği seçtin. Tanıştığın herkes artık sana ağzı kapalı gülümsüyor.'],
  pharmacy: ['You chose Pharmacy. You can now read a doctor\'s handwriting. Nobody else can.', 'Eczacılık seçtin. Artık doktor yazısını okuyabiliyorsun. Başka kimse okuyamıyor.'],
  law: ['You chose Law. You started winning every family argument.', 'Hukuk seçtin. Aile içi tartışmaların hepsini kazanmaya başladın.'],
  architecture: ['You chose Architecture. You have not slept since, but your models are beautiful.', 'Mimarlık seçtin. O günden beri uyumadın ama maketlerin çok güzel.'],
  psychology: ['You chose Psychology. Your friends now begin every sentence with "Don\'t analyse me, but…"', 'Psikoloji seçtin. Arkadaşların artık her cümleye "Beni analiz etme ama…" diye başlıyor.'],
  vet: ['You chose Veterinary Medicine. Every cat in the neighbourhood seems to know.', 'Veterinerlik seçtin. Mahalledeki bütün kediler bunu duymuş gibi.'],
  nursing: ['You chose Nursing. You learned to find a vein in the dark and eat lunch in four minutes.', 'Hemşirelik seçtin. Karanlıkta damar bulmayı ve öğle yemeğini dört dakikada yemeyi öğrendin.'],
  business: ['You chose Business. By week two you said "synergy" without irony.', 'İşletme seçtin. İkinci haftada "sinerji" kelimesini ciddi ciddi kullanmaya başladın.'],
  arts: ['You chose Fine Arts. Everyone asked, very calmly, what the plan is.', 'Güzel Sanatlar seçtin. Herkes çok sakin bir sesle "Peki plan ne?" diye sordu.'],
  education: ['You chose Education. You already have the teacher voice.', 'Öğretmenlik seçtin. Daha ilk dönemden o meşhur öğretmen ses tonunu kaptın.'],
};

/** How far below a major's smarts bar it still shows (greyed out with "Needs Smarts N+"); further below it is hidden. */
const SHOW_BELOW = 15;

/**
 * One choice per major, most selective first. `onPick` runs after setMajor (Campus uses it to start its GPA).
 * The same ids as MAJOR_IDS, so choice ids are stable in saves.
 */
export function majorChoices(onPick?: (c: Ctx, m: MajorId) => void): ChoiceDef[] {
  return [...MAJOR_IDS]
    .sort((a, b) => MAJOR_INFO[b].minScore - MAJOR_INFO[a].minScore)
    .map((m) => {
      const req = MAJOR_INFO[m].minSmarts;
      return {
        id: m,
        label: (c: Ctx) => c.t(MAJOR_INFO[m].en, MAJOR_INFO[m].tr),
        hidden: req ? (c: Ctx) => c.p.stats.smarts < req - SHOW_BELOW : undefined,
        requires: req ? (c: Ctx) => c.p.stats.smarts >= req : undefined,
        requiresLabel: req ? `Needs Smarts ${req}+` : undefined,
        resolve: (c: Ctx) => {
          setMajor(c, m);
          onPick?.(c, m);
          c.h.stat('happiness', 3);
          return c.t(MAJOR_LINES[m][0], MAJOR_LINES[m][1]);
        },
        tone: 'big' as const,
      };
    });
}

/** A university student who has not declared a major yet (and whose Türkiye tercih did not set one). */
export const needsMajor = (c: Ctx) => c.p.school === 'university' && c.p.jailYears === 0 && !majorOf(c.p);

export const majorEvents: EventDef[] = [
  {
    id: 'base.choose_major',
    category: 'school',
    minAge: 16,
    once: true,
    // nearly certain in the first year at university: the major decides which jobs open later
    weight: 100000,
    when: needsMajor,
    title: (c) => c.t('Time to pick your field of study.', 'Bölümünü seçme vakti.'),
    text: (c) =>
      c.t(
        'Everyone has advice. The registrar only wants a form, by Friday. Some doors only open with the right degree.',
        'Herkesin bir tavsiyesi var. Öğrenci işleri ise cumaya kadar sadece bir form istiyor. Bazı kapılar yalnızca doğru diplomayla açılır.',
      ),
    choices: majorChoices(),
  },
];
