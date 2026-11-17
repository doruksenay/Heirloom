import type { Ctx, EventDef } from '../types';
import { opt, out } from './young-kit';

// Echo wave: what an earlier life chose comes back for the heirs (ids base.ec_*). The moral wave sets flags (mr_*);
// when a life closes the engine copies them to dynasty.echoes (game.ts closeLife), and these events read them in a
// later generation. Randomness: only c.rng, the same number of calls in every language.

type Echo = { generation: number; name: string };

/** The echo of an earlier generation's choice, if there is one (never the current life's own). */
const echo = (c: Ctx, flag: string): Echo | undefined => {
  const e = c.s.dynasty.echoes?.[flag];
  return e && e.generation < c.s.dynasty.generation ? e : undefined;
};
const lg = (c: Ctx, n: number) => {
  c.s.dynasty.legacyScore += n;
};
const b = { category: 'random' as const, cooldown: 10, maxPerLife: 1 };
const who = (c: Ctx, flag: string) => echo(c, flag)?.name ?? '';

const KEYS = ['mr_whistleblower', 'mr_paid_bribe', 'mr_cheated', 'mr_chair', 'mr_cash_deal', 'mr_vote_cash'];
const anyEcho = (c: Ctx) => KEYS.filter((k) => echo(c, k));

export const echoWaveEvents: EventDef[] = [
  {
    ...b,
    id: 'base.ec_honest_name',
    minAge: 16,
    weight: 120,
    when: (c) => !!echo(c, 'mr_whistleblower'),
    title: (c) => c.t('The name people trust', 'Güvenilen soyad'),
    text: (c) => c.t(`At the town hall the clerk reads your surname and looks up. "${who(c, 'mr_whistleblower')} once reported what nobody else would. We still talk about it." You are handed the form without the usual queue.`, `Belediyede memur soyadını okuyunca başını kaldırıyor. "${who(c, 'mr_whistleblower')} kimsenin söylemediğini söylemişti. Hâlâ konuşulur." Form, her zamanki kuyruk olmadan elinize veriliyor.`),
    choices: [
      opt('proud', ['Live up to it', 'Bu ada layık ol'], (c) => { lg(c, 3); return out(c, { hap: 3 }, 'You tell yourself to be worth the name. It is a heavy coat, and it fits better than you expected.', 'Kendine bu ada layık olmayı söylüyorsun. Ağır bir palto ama düşündüğünden iyi oturuyor.'); }, { tone: 'good' }),
      opt('shrug', ['Shrug it off', 'Üstünde durma'], (c) => out(c, { hap: -1 }, 'It is not your story and you did not ask for it. You take the form and leave, a little lighter and a little smaller.', 'Bu senin hikâyen değil, istemedin de. Formu alıp çıkıyorsun, biraz hafiflemiş, biraz küçülmüş.')),
    ],
  },
  {
    ...b,
    id: 'base.ec_envelope',
    minAge: 22,
    weight: 120,
    when: (c) => !!echo(c, 'mr_paid_bribe'),
    title: (c) => c.t('The old envelope', 'Eski zarf'),
    text: (c) => c.t(`An official at the permit office smiles a little too warmly. "Your family always knew how to make things move," he says, and lets the sentence hang. ${who(c, 'mr_paid_bribe')} did, apparently.`, `İzin bürosundaki memur gereğinden sıcak gülümsüyor. "Ailen işleri nasıl yürüteceğini hep bilirdi," diyor ve cümleyi havada bırakıyor. Görünüşe göre ${who(c, 'mr_paid_bribe')} bilirmiş.`),
    choices: [
      opt('pay', ['Slip the envelope', 'Zarfı uzat'], (c) => { lg(c, -2); return out(c, { hap: 1, usd: -90 }, 'The permit arrives in two days. You also learn what the family name was buying all those years.', 'İzin iki günde geliyor. Aile adının yıllardır neyi satın aldığını da öğreniyorsun.'); }, { badge: 'Risky', tone: 'bad' }),
      opt('wait', ['Do it the long way', 'Uzun yoldan git'], (c) => { lg(c, 3); return out(c, { hap: 2 }, 'Six weeks and three queues later, you have the permit and a clean conscience. The official avoids your eye on the way out.', 'Altı hafta ve üç kuyruk sonra iznin de, temiz vicdanın da var. Memur çıkarken gözünü kaçırıyor.'); }, { tone: 'good' }),
    ],
  },
  {
    ...b,
    id: 'base.ec_surname_exam',
    minAge: 14,
    maxAge: 26,
    weight: 120,
    needs: ['student'],
    when: (c) => !!echo(c, 'mr_cheated'),
    title: (c) => c.t('Same surname, same seat?', 'Aynı soyad, aynı sıra mı?'),
    text: (c) => c.t(`A teacher moves your desk to the front. "I taught a ${who(c, 'mr_cheated')} from your family once," she says. "Humour me."`, `Öğretmen sıranı öne çekiyor. "Ailenden ${who(c, 'mr_cheated')} diye birine ders vermiştim," diyor. "Bana bir iyilik yap."`),
    choices: [
      opt('prove', ['Prove her wrong', 'Yanıldığını göster'], (c) => { lg(c, 2); return out(c, { sma: 2, hap: 2 }, 'You answer every question yourself and write your name very clearly at the top. She says nothing, which is the nicest thing she could say.', 'Her soruyu kendin yanıtlıyorsun ve adını en üste belirgin yazıyorsun. Hiçbir şey demiyor; diyebileceği en güzel şey bu.'); }, { tone: 'good' }),
      opt('sulk', ['Resent it', 'İçerle'], (c) => out(c, { hap: -3 }, 'You did nothing and are watched anyway. By the third week you have decided that being watched is a kind of permission.', 'Hiçbir şey yapmadın ama izleniyorsun. Üçüncü haftada izlenmenin bir tür izin olduğuna karar veriyorsun.')),
    ],
  },
  {
    ...b,
    id: 'base.ec_family_chair',
    minAge: 25,
    weight: 120,
    when: (c) => !!echo(c, 'mr_chair'),
    title: (c) => c.t('The family chair', 'Ailenin koltuğu'),
    text: (c) => c.t(`The committee has an empty seat, and someone mentions that ${who(c, 'mr_chair')} used to sit in it. "It has been vacant a while. People still look at it when your name is said."`, `Kurulda boş bir koltuk var; biri bir zamanlar orada ${who(c, 'mr_chair')} oturduğunu söylüyor. "Bir süredir boş. Adınız anılınca insanlar hâlâ ona bakıyor."`),
    choices: [
      opt('sit', ['Take the seat', 'Koltuğa otur'], (c) => { lg(c, 4); return out(c, { hap: 2, usd: 50 }, 'It is warm from other people\'s expectations. You sit, and the room rearranges itself around you without being asked.', 'Başkalarının beklentisinden ısınmış. Oturuyorsun; oda sen istemeden çevrene göre yeniden düzeniyor.'); }, { tone: 'good' }),
      opt('pass', ['Leave it empty', 'Boş bırak'], (c) => out(c, { hap: 1 }, 'You say the seat belongs to its history, not to you. Someone writes that down; it will be repeated, slightly improved, for years.', 'Koltuğun tarihine ait olduğunu, sana ait olmadığını söylüyorsun. Biri bunu not alıyor; yıllarca, biraz süslenerek anlatılacak.')),
    ],
  },
  {
    ...b,
    id: 'base.ec_books',
    minAge: 25,
    weight: 120,
    when: (c) => !!echo(c, 'mr_cash_deal'),
    title: (c) => c.t('The inspector remembers', 'Müfettiş hatırlıyor'),
    text: (c) => c.t(`A tax inspector comes by for a routine check. "Funny," he says, flipping through your file, "your family has a long history of cash. ${who(c, 'mr_cash_deal')} was a favourite of the office."`, `Bir vergi müfettişi rutin kontrole geliyor. Dosyanı karıştırırken "Garip," diyor, "ailenizin nakitle uzun bir geçmişi var. ${who(c, 'mr_cash_deal')} dairede çok anılırdı."`),
    choices: [
      opt('open', ['Open every book', 'Bütün defterleri aç'], (c) => { lg(c, 2); return out(c, { hap: 1, usd: -60 }, 'Everything is in order, after a long afternoon and a small correction. He stamps the page and stays for tea out of what looks like respect.', 'Uzun bir öğleden sonra ve küçük bir düzeltmeyle her şey yolunda. Sayfayı mühürlüyor, saygıdan olsa gerek çay içmeye kalıyor.'); }, { tone: 'good' }),
      opt('smile', ['Smile and say little', 'Gülümse, az konuş'], (c) => {
        if (c.rng.chance(0.5)) return out(c, { hap: -4, usd: -300 }, 'He asks the one question you did not prepare for. The fine is the size of an old habit.', 'Hazırlanmadığın tek soruyu soruyor. Ceza, eski bir alışkanlığın boyunda.');
        return out(c, { hap: 1 }, 'He leaves with a nod and a long look at the cash drawer. You decide to start using the bank.', 'Bir baş selamı ve kasaya uzun bir bakışla gidiyor. Bankayı kullanmaya karar veriyorsun.');
      }, { badge: 'Risky' }),
    ],
  },
  {
    ...b,
    id: 'base.ec_runner',
    minAge: 20,
    weight: 120,
    when: (c) => !!echo(c, 'mr_vote_cash'),
    title: (c) => c.t('Somebody expects your vote', 'Biri oyunu bekliyor'),
    text: (c) => c.t(`A campaign runner knocks, glances at the nameplate and relaxes. "${who(c, 'mr_vote_cash')} was always so reasonable," he says, and his hand drifts to his jacket pocket.`, `Seçim çalışanı kapıyı çalıyor, kapıdaki isme bakınca rahatlıyor. "${who(c, 'mr_vote_cash')} hep çok anlayışlıydı," diyor ve eli ceketinin cebine gidiyor.`),
    choices: [
      opt('take', ['Take it', 'Al'], (c) => { lg(c, -2); return out(c, { hap: -1, usd: 40 }, 'The money is easy and the shame is oddly familiar, as if it came with the furniture.', 'Para kolay, utanç tuhaf biçimde tanıdık; sanki mobilyayla birlikte gelmiş.'); }, { badge: 'Risky', tone: 'bad' }),
      opt('refuse', ['Close the door politely', 'Kapıyı nazikçe kapat'], (c) => { lg(c, 3); return out(c, { hap: 2 }, 'You say you vote for free. He writes it down as if it were a rare condition.', 'Oyunu bedava kullandığını söylüyorsun. Bunu nadir bir hastalıkmış gibi not alıyor.'); }, { tone: 'good' }),
    ],
  },
  {
    ...b,
    id: 'base.ec_family_story',
    minAge: 12,
    maxAge: 40,
    weight: 100,
    cooldown: 12,
    when: (c) => anyEcho(c).length > 0,
    setup: (c) => {
      const ks = anyEcho(c);
      c.vars.k = c.rng.pick(ks);
    },
    title: (c) => c.t('The story told at the table', 'Sofrada anlatılan hikâye'),
    text: (c) => {
      const k = String(c.vars.k);
      const n = who(c, k);
      const line: Record<string, [string, string]> = {
        mr_whistleblower: [`someone tells how ${n} refused to keep quiet, and what it cost.`, `biri ${n} adlı atanın susmayı nasıl reddettiğini ve bedelini anlatıyor.`],
        mr_paid_bribe: [`someone laughs about the envelope ${n} once left on a desk.`, `biri ${n} adlı atanın bir masaya bıraktığı zarfa gülüyor.`],
        mr_cheated: [`someone mentions the exam ${n} should not have passed.`, `biri ${n} adlı atanın geçmemesi gereken sınavını anıyor.`],
        mr_chair: [`someone points at the chair ${n} once held in the committee.`, `biri ${n} adlı atanın kurulda bir zamanlar tuttuğu koltuğu işaret ediyor.`],
        mr_cash_deal: [`someone winks about the cash deals ${n} was known for.`, `biri ${n} adlı atanın meşhur nakit işlerine göz kırpıyor.`],
        mr_vote_cash: [`someone recalls the time ${n} sold a vote for the price of dinner.`, `biri ${n} adlı atanın bir oyu akşam yemeği fiyatına sattığını hatırlıyor.`],
      };
      const l = line[k] ?? line.mr_chair;
      return c.t(`At the long table, over the second helping, ${l[0]} The room goes quiet and then very loud.`, `Uzun sofrada ikinci porsiyonda ${l[1]} Oda önce sessizleşiyor, sonra çok gürültülü oluyor.`);
    },
    choices: [
      opt('ask', ['Ask for the whole story', 'Hepsini anlat de'], (c) => { c.s.dynasty.legacyScore += 1; return out(c, { hap: 2, sma: 1 }, 'You get three versions, two of which contradict each other. You decide the family is better at stories than at facts.', 'Üç versiyon geliyor, ikisi birbirini yalanlıyor. Ailenin hikâyede olgudan daha iyi olduğuna karar veriyorsun.'); }, { tone: 'good' }),
      opt('change', ['Change the subject', 'Konuyu değiştir'], (c) => out(c, { hap: 1 }, 'You ask someone to pass the bread. The story waits politely in the corner, as family stories do.', 'Birinden ekmeği uzatmasını istiyorsun. Hikâye, aile hikâyeleri gibi, köşede nazikçe bekliyor.')),
    ],
  },
  {
    ...b,
    id: 'base.ec_tradition',
    minAge: 18,
    weight: 100,
    cooldown: 15,
    when: (c) => c.s.dynasty.generation >= 3 && !c.h.has('ec_tradition_done'),
    title: (c) => c.t('A tradition nobody remembers starting', 'Kimsenin başlangıcını hatırlamadığı gelenek'),
    text: (c) => c.t(`Every year the family eats the same dish on the same day and nobody can say why. This year you are the one who has to either cook it or end it. Generation ${c.s.dynasty.generation} has its own opinions.`, `Aile her yıl aynı günde aynı yemeği yiyor ve kimse nedenini bilmiyor. Bu yıl onu pişirmek ya da bitirmek sana düştü. ${c.s.dynasty.generation}. kuşağın kendi fikirleri var.`),
    choices: [
      opt('keep', ['Keep it exactly', 'Aynen sürdür'], (c) => { c.h.flag('ec_tradition_done'); lg(c, 3); return out(c, { hap: 3 }, 'It is a little dry and entirely perfect. An uncle cries without explanation. The tradition survives another generation.', 'Biraz kuru ve tamamen mükemmel. Bir amca nedensiz ağlıyor. Gelenek bir kuşak daha yaşıyor.'); }, { tone: 'good' }),
      opt('change', ['Make it your own', 'Kendine göre değiştir'], (c) => { c.h.flag('ec_tradition_done'); lg(c, 1); return out(c, { hap: 2 }, 'You change the recipe and the date. Half the family complains; the other half asks for seconds.', 'Tarifi ve günü değiştiriyorsun. Ailenin yarısı şikâyet ediyor, öbür yarısı ikinci tabak istiyor.'); }),
    ],
  },
];
