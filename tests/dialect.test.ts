import { describe, expect, it } from 'vitest';
import { dialectOf, localizeEn } from '../src/i18n/dialect';

describe('English dialects', () => {
  it('picks the dialect from the country of the life', () => {
    expect(dialectOf('us')).toBe('us');
    expect(dialectOf('uk')).toBe('uk');
    expect(dialectOf('ca')).toBe('ca');
    expect(dialectOf('de')).toBe('us');
    expect(dialectOf('tr')).toBe('us');
  });

  it('writes American in the US', () => {
    const t = (s: string) => localizeEn(s, 'us');
    expect(t('Your favourite neighbour apologised.')).toBe('Your favorite neighbor apologized.');
    expect(t('Mum cried, Mummy laughed. MUM!')).toBe('Mom cried, Mommy laughed. MOM!');
    expect(t('A grey moustache and a cheque for the licence.')).toBe('A gray mustache and a check for the license.');
    expect(t('You were travelling to the centre of town.')).toBe('You were traveling to the center of town.');
    expect(t('He labelled the biscuits and ate the crisps with the pram.')).toBe('He labeled the cookies and ate the chips with the stroller.');
    expect(t('You started primary school. The head teacher waved.')).toBe('You started elementary school. The principal waved.');
    expect(t('Best holiday ever. You went on holiday together.')).toBe('Best vacation ever. You went on vacation together.');
    expect(t('A flat tyre.')).toBe('A flat tire.');
    expect(t('A flat two streets away. You bought the flat with a mortgage. Your small flat. They build flats.')).toBe(
      'An apartment two streets away. You bought the apartment with a mortgage. Your small apartment. They build apartments.',
    );
    expect(t('The joke fell flat. The shirt was ironed flat.')).toBe('The joke fell flat. The shirt was ironed flat.');
    expect(t('One torch and a box of candles. You queued up. The queue went round the block.')).toBe(
      'One flashlight and a box of candles. You lined up. The line went round the block.',
    );
    expect(t('You practised the piano and recognised the organisation.')).toBe('You practiced the piano and recognized the organization.');
    expect(t('Buy a flat outright. A €138,000 flat in The Hague. You showed the same flat 41 times. Each flat is small. A recognisable face by torchlight.')).toBe(
      'Buy an apartment outright. A €138,000 apartment in The Hague. You showed the same apartment 41 times. Each apartment is small. A recognizable face by flashlight.',
    );
    expect(t('Barbaros Primary School. She sighed in B flat. The bay was flat as glass.')).toBe('Barbaros Elementary School. She sighed in B flat. The bay was flat as glass.');
    expect(t('Your mobile phone rang. The car boot was full.')).toBe('Your cell phone rang. The trunk was full.');
  });

  it('writes Canadian in Canada: American words and -ize, but -our, -re and grey stay', () => {
    const t = (s: string) => localizeEn(s, 'ca');
    expect(t('Your favourite neighbour apologised at the centre.')).toBe('Your favourite neighbour apologized at the centre.');
    expect(t('Mum bought a grey jumper. The holiday cottage is a flat.')).toBe('Mom bought a grey sweater. The cottage is an apartment.');
    expect(t('You practised. The cheque cleared.')).toBe('You practised. The cheque cleared.');
  });

  it('writes British in the UK', () => {
    const t = (s: string) => localizeEn(s, 'uk');
    expect(t('Your favorite neighbor apologized to mom.')).toBe('Your favourite neighbour apologised to mum.');
    expect(t('A gray sidewalk by the elementary school. Candy for the vacation.')).toBe('A grey pavement by the primary school. Sweets for the holiday.');
    expect(t('You rang the colourful flat.')).toBe('You rang the colourful flat.');
  });

  it('leaves words that only look British alone, in every dialect', () => {
    const same = 'You were surprised. A promise, a tour, four hours, your noise, a raise, the exercise, flour, pour, a tortoise, advised, otherwise, sunrise, the Grayson family, a tire that you tire of.';
    for (const c of ['us', 'ca', 'uk', 'de']) expect(localizeEn(same, c)).toBe(same);
  });

  it('is idempotent and keeps Turkish names and punctuation intact', () => {
    const samples = [
      'Your favourite neighbour Gül apologised, “Mum!” she said. ₺1,283,440 for a flat in Zonguldak.',
      'A flat tyre, a flat two streets away, and a grey day on holiday.',
      'The queue for the cinema, the car park and the crisps.',
    ];
    for (const c of ['us', 'ca', 'uk']) {
      for (const s of samples) {
        const once = localizeEn(s, c);
        expect(localizeEn(once, c)).toBe(once);
      }
    }
    expect(localizeEn('Gül paid ₺1,283,440 for a flat in Zonguldak.', 'us')).toBe('Gül paid ₺1,283,440 for an apartment in Zonguldak.');
  });
});

describe('torch idiom', () => {
  it('keeps "passed the torch" but still converts the lamp', () => {
    for (const c of ['us', 'ca', 'uk']) expect(localizeEn('At 66, you passed the torch to Asya. Carry the torch.', c)).toBe('At 66, you passed the torch to Asya. Carry the torch.');
    expect(localizeEn('One torch in the drawer.', 'us')).toBe('One flashlight in the drawer.');
  });
});

describe('flat-pack', () => {
  it('stays flat-pack in every dialect', () => {
    for (const c of ['us', 'ca', 'uk']) expect(localizeEn('You bought a flat-pack wardrobe and the flat pack was heavy.', c)).toBe('You bought a flat-pack wardrobe and the flat pack was heavy.');
  });
});
