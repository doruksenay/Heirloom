import type { ActivityDef, Ctx } from '../types';
import { wage } from '../base/util';
import { fameState, gainFans, isPath, loseFans, peekFame } from './state';
import { compact, fameOf, free, hasPath } from './util';

// Fame v0.7: six more things to do with your fame.

const PODCASTS = ['Unfiltered', 'Two Chairs, One Mic', 'Tea and Gossip', 'Backstage'];
const PODCASTS_TR = ['Filtresiz', 'İki Sandalye Bir Mikrofon', 'Çay ve Dedikodu', 'Kulis'];

/** Pick one of several [en, tr] lines with a single RNG call. */
const line = (c: Ctx, lines: [string, string][]) => {
  const i = c.rng.int(0, lines.length - 1);
  return c.t(lines[i][0], lines[i][1]);
};

export const moreFameActivities: ActivityDef[] = [
  {
    id: 'fame_video',
    label: (c) => c.t('Shoot a music video', 'Klip çek'),
    description: (c) => c.t('For your latest release. Your label pays, if you have one', 'Son şarkın için. Plak şirketin varsa masrafı o öder'),
    group: 'Fame',
    minAge: 14,
    available: (c) => isPath(c, 'music') && free(c) && fameState(c.p).songs.some((s) => s.released),
    run: (c) => {
      const f = fameState(c.p);
      const song = f.songs.filter((s) => s.released).reduce((a, b) => (b.year >= a.year ? b : a));
      const cost = f.label ? 0 : wage(c, Math.min(40000, 1500 + f.fans * 0.004));
      c.h.money(-cost);
      const q = Math.max(1, Math.min(100, Math.round(song.quality * 0.6 + c.rng.int(0, 40))));
      const g = gainFans(c, f, f.fans * 0.06 * (q / 60) + q * 60);
      const paid = cost ? c.t(` It cost ${c.h.fmt(cost)}.`, ` Masrafı ${c.h.fmt(cost)} tuttu.`) : '';
      if (q >= 75)
        return c.t(
          `The video for "${song.title}" is one long take with a dance in a dolmuş. Everyone is copying it. ${compact(c, g)} new fans.${paid}`,
          `"${song.title}" klibini tek planda, dolmuşta dans ederek çektin. Herkes taklit ediyor. ${compact(c, g)} yeni hayran.${paid}`,
        );
      if (q >= 45)
        return c.t(
          `The video for "${song.title}" is decent. The comments are mostly about your jacket. ${compact(c, g)} new fans.${paid}`,
          `"${song.title}" klibi fena olmadı. Yorumların çoğu ceketinle ilgili. ${compact(c, g)} yeni hayran.${paid}`,
        );
      return c.t(
        `You shot the video for "${song.title}" in your aunt's living room. It shows. ${compact(c, g)} new fans anyway.${paid}`,
        `"${song.title}" klibini teyzenin oturma odasında çektin. Belli oluyor. Yine de ${compact(c, g)} yeni hayran.${paid}`,
      );
    },
  },
  {
    id: 'fame_podcast',
    label: (c) => (peekFame(c.p)?.podcast ? c.t('Record a podcast episode', 'Podcast bölümü kaydet') : c.t('Start a podcast', 'Podcast başlat')),
    description: (c) => c.t('Talk for an hour. Sponsors come at 50K fans', 'Bir saat konuş. Sponsorlar 50 bin hayranda gelir'),
    group: 'Fame',
    minAge: 16,
    available: (c) => hasPath(c) && free(c),
    run: (c) => {
      const f = fameState(c.p);
      if (!f.podcast) {
        const n = c.rng.int(0, PODCASTS.length - 1);
        f.podcastName = n;
        f.podcast = 1;
        const g = gainFans(c, f, f.fans * 0.02 + 300);
        return c.t(
          `You started a podcast called "${PODCASTS[n]}". Episode one was forty minutes about your new microphone. ${compact(c, g)} new fans.`,
          `"${PODCASTS_TR[n]}" adında bir podcast başlattın. İlk bölüm kırk dakika boyunca yeni mikrofonunu anlattı. ${compact(c, g)} yeni hayran.`,
        );
      }
      f.podcast++;
      if (c.rng.chance(0.08)) {
        f.scandals++;
        const lost = loseFans(f, 0.04);
        return c.t(
          `You said something on episode ${f.podcast} that you would very much like to unsay. ${compact(c, lost)} fans left.`,
          `${f.podcast}. bölümde keşke hiç söylemeseydim dediğin bir laf ettin. ${compact(c, lost)} hayran gitti.`,
        );
      }
      const g = gainFans(c, f, f.fans * 0.02 + 300);
      const pay = f.fans >= 50000 ? wage(c, Math.min(30000, f.fans * 0.005)) : 0;
      c.h.money(pay);
      const what = line(c, [
        ['Your guest was two hours late and blamed the traffic.', 'Konuğun iki saat geç kaldı ve trafiği suçladı.'],
        ['You argued with a guest about ketchup on pizza for a whole episode.', 'Bir konukla bütün bölüm boyunca pizzaya ketçap konur mu diye tartıştın.'],
        ['Your grandmother called in and stole the show.', 'Babaannen yayına bağlandı ve bütün ilgiyi üstüne çekti.'],
        ['You recorded a whole episode with the microphone switched off.', 'Bütün bir bölümü mikrofon kapalıyken kaydettin.'],
      ]);
      return pay
        ? c.t(`${what} ${compact(c, g)} new fans and ${c.h.fmt(pay)} from sponsors.`, `${what} ${compact(c, g)} yeni hayran; sponsorlardan da ${c.h.fmt(pay)} geldi.`)
        : c.t(`${what} ${compact(c, g)} new fans.`, `${what} ${compact(c, g)} yeni hayran.`);
    },
  },
  {
    id: 'fame_live',
    label: (c) => c.t('Go live', 'Canlı yayın aç'),
    description: (c) => c.t('Chat with followers. They send gifts', 'Takipçilerinle sohbet et. Hediye gönderirler'),
    group: 'Fame',
    minAge: 13,
    available: (c) => isPath(c, 'social') && free(c),
    run: (c) => {
      const f = fameState(c.p);
      const what = line(c, [
        ['You answered questions for two hours. Someone asked for your simit recipe.', 'İki saat soru cevapladın. Biri simit tarifini sordu.'],
        ['You played a video game live and lost to a twelve-year-old.', 'Canlı yayında oyun oynadın ve on iki yaşında bir çocuğa yenildin.'],
        ['You cooked menemen live. The onion debate lasted longer than the cooking.', 'Canlı yayında menemen yaptın. Soğan tartışması pişirmekten uzun sürdü.'],
      ]);
      const gifts = wage(c, Math.min(20000, 20 + f.fans * 0.004));
      c.h.money(gifts);
      const g = gainFans(c, f, f.fans * 0.03 + 200);
      return c.t(`${what} Viewers sent ${c.h.fmt(gifts)} in gifts and ${compact(c, g)} new followers came.`, `${what} İzleyiciler ${c.h.fmt(gifts)} değerinde hediye gönderdi, ${compact(c, g)} yeni takipçi geldi.`);
    },
  },
  {
    id: 'fame_influencer',
    label: (c) => c.t('Team up with an influencer', 'Bir fenomenle ortak video çek'),
    description: (c) => c.t('Reach their followers. Needs 2K fans', 'Onun takipçilerine ulaş. 2 bin hayran gerekir'),
    group: 'Fame',
    minAge: 13,
    available: (c) => (isPath(c, 'music') || isPath(c, 'acting')) && free(c) && fameState(c.p).fans >= 2000,
    run: (c) => {
      const f = fameState(c.p);
      const music = f.path === 'music';
      if (c.rng.chance(0.8)) {
        const i = c.rng.int(0, 2);
        const g = gainFans(c, f, f.fans * 0.1 + 1000);
        const n = compact(c, g);
        return music
          ? c.t(
              [`An influencer started a dance challenge to your song. ${n} new fans, and your knees hurt.`, `An influencer lip-synced your song in a moving car. ${n} new fans and one traffic fine.`, `You and an influencer covered each other's favourite songs. ${n} new fans.`][i],
              [`Bir fenomen şarkınla dans akımı başlattı. ${n} yeni hayran; dizlerin de ağrıyor.`, `Bir fenomen, giden arabada şarkına playback yaptı. ${n} yeni hayran ve bir trafik cezası.`, `Bir fenomenle birbirinizin en sevdiği şarkıları söylediniz. ${n} yeni hayran.`][i],
            )
          : c.t(
              [`You shot a sketch with an influencer. Your fake slap became a meme. ${n} new fans.`, `You and an influencer re-enacted a famous soap opera scene. ${n} new fans.`, `An influencer filmed a "day on set" with you. ${n} new fans and a lot of catering footage.`][i],
              [`Bir fenomenle skeç çektin. Sahte tokadın caps oldu. ${n} yeni hayran.`, `Bir fenomenle ünlü bir dizi sahnesini yeniden canlandırdınız. ${n} yeni hayran.`, `Bir fenomen seninle "setteki bir günüm" videosu çekti. ${n} yeni hayran ve bolca yemek arası görüntüsü.`][i],
            );
      }
      c.h.stat('happiness', -2);
      return music
        ? c.t('The influencer called you "the music guy" in every take. Nobody watched it.', 'Fenomen her çekimde sana "şu müzisyen" dedi. Kimse izlemedi.')
        : c.t('The influencer kept fixing their hair during your lines. Nobody watched it.', 'Fenomen sen replik söylerken durmadan saçını düzeltti. Kimse izlemedi.');
    },
  },
  {
    id: 'fame_charity',
    label: (c) => c.t('Do charity work', 'Hayır işi yap'),
    description: (c) => c.t('+Happiness, a few fans', '+Mutluluk, birkaç hayran'),
    group: 'Fame',
    minAge: 12,
    available: (c) => hasPath(c) && free(c) && fameOf(c) >= 15,
    run: (c) => {
      const f = fameState(c.p);
      c.h.stat('happiness', 5);
      const what = line(c, [
        ["You read stories at a children's hospital and did all the voices.", 'Bir çocuk hastanesinde masal okudun, bütün karakterleri seslendirdin.'],
        ['You auctioned your stage outfit for an animal shelter. A dentist bought it.', 'Sahne kıyafetini bir hayvan barınağı için açık artırmaya çıkardın. Bir diş hekimi aldı.'],
        ['You planted trees with a school class. A ten-year-old corrected your technique.', 'Bir okul sınıfıyla ağaç diktin. On yaşında bir çocuk tekniğini düzeltti.'],
        ['You served soup at a community kitchen. Nobody recognised you, which was nice.', 'Bir aşevinde çorba dağıttın. Kimse seni tanımadı; bu da hoşuna gitti.'],
      ]);
      const g = gainFans(c, f, f.fans * 0.02 + 300);
      return c.t(`${what} ${compact(c, g)} new fans.`, `${what} ${compact(c, g)} yeni hayran.`);
    },
  },
  {
    id: 'fame_stylist',
    label: (c) => c.t('Hire a stylist', 'Stilist tut'),
    description: (c) => c.t('+Looks, costs money', '+Görünüş, para ister'),
    group: 'Fame',
    minAge: 15,
    available: (c) => hasPath(c) && free(c),
    run: (c) => {
      const cost = wage(c, 2000);
      c.h.money(-cost);
      c.h.stat('looks', c.rng.int(2, 4));
      const what = line(c, [
        ['Your stylist burned your favourite cargo shorts. In a ceremony.', 'Stilistin en sevdiğin kargo şortunu yaktı. Törenle.'],
        ['Your stylist called your haircut "brave". It was not a compliment.', 'Stilistin saç kesimine "cesur" dedi. İltifat değildi.'],
        ['You got a whole new look. Your own mother walked past you in the street.', 'Baştan aşağı yeni bir tarzın oldu. Öz annen sokakta yanından geçip gitti.'],
      ]);
      return c.t(`${what} It cost ${c.h.fmt(cost)}.`, `${what} Masrafı ${c.h.fmt(cost)} tuttu.`);
    },
  },
];
