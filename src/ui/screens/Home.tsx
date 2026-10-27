import { useState } from 'preact/hooks';
import type { AppApi } from '../app-state';
import { buyFurniture, furniturePrice } from '../../engine/game';
import { FURNITURE, SLOTS, STYLE_SETS, currentTier, furniture, homeTier, setProgress, type FurnitureDef } from '../../engine/home';
import { alivePets, displayName, kindLabel, petAge, petsOf, type Pet, type PetKind } from '../../engine/pets';
import { homeTitle } from '../../content/base/activities-home';
import { heirloomDef } from '../../engine/heirlooms';
import { fmtMoney } from '../../engine/context';
import { Icon } from '../icons';
import { FurnitureArt } from '../FurnitureArt';
import { T, Tn } from '../../i18n/ui';

// ---------------------------------------------------------------- pets, drawn around their feet at (0, 0)

const NAMED_COATS: Record<string, [string, string]> = {
  Karabaş: ['#E3D3B8', '#2B2422'], // "black head"
  Pamuk: ['#F1ECE4', '#F1ECE4'], // "cotton"
  Duman: ['#9A9AA2', '#86868F'], // "smoke"
  Tarçın: ['#C9773A', '#B5662E'], // "cinnamon"
  Fındık: ['#9A6A3E', '#87592F'], // "hazelnut"
  Zeytin: ['#2E2A27', '#2E2A27'], // "olive"
  Boncuk: ['#3A3433', '#3A3433'],
  Limon: ['#E8D35A', '#E8D35A'],
  Maviş: ['#6FA8DC', '#6FA8DC'],
};
const COATS: Record<PetKind, string[]> = {
  dog: ['#C8925A', '#3A302C', '#E8DCC8', '#8A5A3A'],
  cat: ['#E59A4C', '#F1ECE4', '#555058', '#B9A48C'],
  bird: ['#8CCB5E', '#6FA8DC', '#E8D35A'],
  fish: ['#F08A3C', '#E8B33C', '#E8573C'],
  rabbit: ['#EDE6DD', '#A88A70', '#6B6260'],
  turtle: ['#6C8C45'],
  horse: ['#7A4A2A', '#3A2A22', '#C9A27A'],
};
function coat(pet: Pet): [string, string] {
  const named = NAMED_COATS[pet.name];
  if (named) return named;
  const list = COATS[pet.kind];
  let h = 0;
  for (const ch of pet.name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const c = list[h % list.length];
  return [c, c];
}
const INK = '#1C1622';

function PetShape({ pet }: { pet: Pet }) {
  const [body, head] = coat(pet);
  switch (pet.kind) {
    case 'dog':
      return (
        <g>
          <path d="M13 -17q9 -5 8 -14" stroke={body} stroke-width="3.5" fill="none" stroke-linecap="round" />
          {[-10, -5, 5, 10].map((x) => (
            <rect key={x} x={x - 1.8} y="-11" width="3.6" height="11" rx="1.5" fill={body} />
          ))}
          <ellipse cx="0" cy="-16" rx="15" ry="8.5" fill={body} />
          <circle cx="-15" cy="-25" r="7.5" fill={head} />
          <ellipse cx="-21.5" cy="-22.5" rx="4.5" ry="3.2" fill={head} />
          <ellipse cx="-11" cy="-24" rx="3" ry="6" fill={head} style={{ filter: 'brightness(0.75)' }} />
          <circle cx="-25.5" cy="-23.5" r="1.4" fill={INK} />
          <circle cx="-17.5" cy="-27" r="1.1" fill={head === '#2B2422' || head === '#2E2A27' || head === '#3A302C' ? '#F5EEE6' : INK} />
        </g>
      );
    case 'cat':
      return (
        <g>
          <path d="M-13 -3q-8 -1 -6 -8" stroke={body} stroke-width="3" fill="none" stroke-linecap="round" />
          <ellipse cx="0" cy="-8" rx="14" ry="8" fill={body} />
          <circle cx="11" cy="-15" r="6.5" fill={head} />
          <path d="M6.5 -19l1 -6 4 4zM12 -21l4 -4 1 6z" fill={head} />
          <path d="M9.5 -15.5h2M14 -15.5h2" stroke={INK} stroke-width="1.1" stroke-linecap="round" />
        </g>
      );
    case 'rabbit':
      return (
        <g>
          <circle cx="9" cy="-7" r="3" fill="#FFFFFF" />
          <ellipse cx="0" cy="-7" rx="9.5" ry="7" fill={body} />
          <circle cx="-8" cy="-12" r="5" fill={body} />
          <ellipse cx="-9" cy="-21" rx="1.8" ry="6" fill={body} transform="rotate(-12 -9 -21)" />
          <ellipse cx="-5.5" cy="-21" rx="1.8" ry="6" fill={body} transform="rotate(10 -5.5 -21)" />
          <circle cx="-10" cy="-13" r="0.9" fill={INK} />
        </g>
      );
    case 'turtle':
      return (
        <g>
          <ellipse cx="-12" cy="-4" rx="4" ry="3" fill="#A5B86A" />
          <rect x="-8" y="-4" width="3.5" height="4" rx="1.5" fill="#A5B86A" />
          <rect x="4" y="-4" width="3.5" height="4" rx="1.5" fill="#A5B86A" />
          <path d="M-10 -3a10 9 0 0 1 20 0z" fill={body} />
          <path d="M-5 -4l2 -5h6l2 5M0 -9v5" stroke="#47602C" stroke-width="1" fill="none" />
          <circle cx="-13.5" cy="-5" r="0.8" fill={INK} />
        </g>
      );
    case 'bird':
      return (
        <g>
          <ellipse cx="0" cy="-6" rx="5" ry="6.5" fill={body} />
          <circle cx="0" cy="-13" r="3.6" fill={body} />
          <path d="M-3.3 -13l-2.6 1 2.4 1z" fill="#E7A23C" />
          <path d="M3 -3l4 6-5 -2z" fill={body} />
          <circle cx="-1.2" cy="-13.8" r="0.8" fill={INK} />
        </g>
      );
    case 'fish':
      return (
        <g>
          <circle cx="0" cy="-11" r="11" fill="#9FD3E6" opacity="0.45" stroke="#CFEAF3" stroke-width="1.2" />
          <ellipse cx="-1" cy="-9" rx="4.2" ry="2.8" fill={body} />
          <path d="M3 -9l4 -3v6z" fill={body} />
          <path d="M-7 -20h14" stroke="#CFEAF3" stroke-width="1.5" />
        </g>
      );
    case 'horse':
      return (
        <g>
          {[-11, -6, 7, 12].map((x) => (
            <rect key={x} x={x - 1.6} y="-14" width="3.2" height="14" fill={body} />
          ))}
          <ellipse cx="0" cy="-18" rx="15" ry="7" fill={body} />
          <path d="M-14 -22l-6 -15 8 -2 6 13z" fill={body} />
          <ellipse cx="-22" cy="-33" rx="7.5" ry="3.6" fill={body} transform="rotate(35 -22 -33)" />
          <path d="M-17 -40l1 -5 3 4z" fill={body} />
          <path d="M-13 -39l6 14" stroke={INK} stroke-width="2.4" opacity="0.55" stroke-linecap="round" />
          <circle cx="-21" cy="-35" r="0.9" fill={INK} />
          <path d="M15 -20q5 2 4 10" stroke={INK} stroke-width="2.5" fill="none" opacity="0.6" />
        </g>
      );
  }
}

/** Small square icon of a pet for lists. */
function PetIcon({ pet }: { pet: Pet }) {
  const box: Record<PetKind, string> = {
    dog: '-30 -36 54 40',
    cat: '-18 -28 38 32',
    rabbit: '-18 -30 34 34',
    turtle: '-19 -16 32 20',
    bird: '-9 -19 18 22',
    fish: '-13 -24 26 26',
    horse: '-25 -38 48 42',
  };
  return (
    <svg viewBox={box[pet.kind]} width="34" height="34" aria-hidden="true">
      <PetShape pet={pet} />
    </svg>
  );
}

// ---------------------------------------------------------------- the room

const at = (x: number, y: number, s = 1) => `translate(${x} ${y}) scale(${s})`;

function Room({ items, heirlooms, pets, garden }: { items: string[]; heirlooms: string[]; pets: Pet[]; garden: boolean }) {
  const pick = (slot: string) => items.map((i) => furniture(i)).find((f) => f?.slot === slot)?.id;
  const sofa = pick('sofa');
  const kitchen = pick('kitchen');
  const tv = pick('tv');
  const art = pick('art');
  const lamp = pick('lamp');
  const shelf = pick('shelf');
  const plant = pick('plant');
  const rug = pick('rug');
  const bed = pick('bed');
  const desk = pick('desk');
  const bath = pick('bath');
  const petbed = pick('petbed');
  const yard = garden ? pick('garden') : undefined;
  const piano = heirlooms.includes('piano');
  const kinds = (k: PetKind) => pets.filter((p) => p.kind === k);
  const dogs = kinds('dog');
  const cats = kinds('cat');
  const birds = kinds('bird');
  const fish = kinds('fish');
  const rabbits = kinds('rabbit');
  const turtles = kinds('turtle');
  const horses = kinds('horse');

  return (
    <div class="room">
      <svg viewBox="0 0 440 260" role="img" aria-label={T('Your living room')}>
        <rect width="440" height="260" style={{ fill: 'var(--room-wall)' }} />
        <rect y="176" width="440" height="84" style={{ fill: 'var(--room-floor)' }} />
        <rect y="172" width="440" height="4" fill="#000" opacity="0.18" />

        {/* bathroom door, left */}
        <g>
          <rect x="6" y="58" width="52" height="118" rx="2" fill="#6B5446" />
          <rect x="12" y="64" width="40" height="112" fill={bath === 'bath_hamam' ? '#7FBFC0' : '#CFE0E3'} />
          <path d="M12 82h40M12 100h40M12 118h40M12 136h40M12 154h40M22 64v112M32 64v112M42 64v112" stroke="#fff" stroke-width="0.8" opacity="0.45" />
          {!bath && <path d="M40 80v4M36 84h8v22h-8z" stroke="#9A8A7A" stroke-width="1.5" fill="#E7B55E" />}
          {bath === 'bath_shower' && (
            <g>
              <path d="M16 70h32M44 70v-4" stroke="#B8B8C0" stroke-width="2" />
              <circle cx="44" cy="74" r="3" fill="#B8B8C0" />
              <path d="M16 72h14v100h-14z" fill="#F5EEE6" />
              <path d="M20 72v100M25 72v100" stroke="#6FA8DC" stroke-width="2" />
            </g>
          )}
          {bath === 'bath_hamam' && (
            <g>
              <path d="M18 74h28M24 80h16" stroke="#E7B55E" stroke-width="2" />
              <path d="M30 112h6v6" stroke="#E7B55E" stroke-width="2.5" fill="none" />
              <path d="M18 132h28v30a4 4 0 0 1-4 4h-20a4 4 0 0 1-4-4z" fill="#F2EFEA" />
              <path d="M18 132h28" stroke="#D8D2C8" stroke-width="3" />
              <ellipse cx="27" cy="129" rx="5" ry="2.4" fill="#E7B55E" />
            </g>
          )}
          {bath === 'bath_pink' && (
            <g>
              <path d="M38 104v-8a4 4 0 0 1 8 0" stroke="#B8B8C0" stroke-width="2" fill="none" />
              <path d="M13 138h38v14a12 12 0 0 1-12 12h-14a12 12 0 0 1-12-12z" fill="#F2A7B8" />
              <path d="M17 164l-2 8M47 164l2 8" stroke="#E7B55E" stroke-width="3" stroke-linecap="round" />
            </g>
          )}
          <path d="M52 64l9 5v107h-9z" fill="#8A6A52" />
        </g>

        {/* kitchen */}
        {(() => {
          const look = {
            kitchen_copper: { base: '#6B4A2E', top: '#D9CBB5', upper: null as string | null },
            kitchen_oak: { base: '#ECE6DA', top: '#D9B98C', upper: '#F4F0E8' },
            kitchen_avocado: { base: '#8A9A3B', top: '#E3C77A', upper: '#7C8B33' },
          }[kitchen as string] ?? { base: '#8A7C6E', top: '#B9AC9C', upper: null };
          return (
            <g>
              {kitchen === 'kitchen_copper' && (
                <g>
                  {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <rect key={i} x={68 + i * 10} y="112" width="9" height="9" fill={i % 2 ? '#2E8C9A' : '#F5EEE6'} />
                  ))}
                  <path d="M68 70h78" stroke="#5A3E28" stroke-width="3" />
                  {[80, 100, 122].map((x, i) => (
                    <g key={x}>
                      <path d={`M${x} 70v8`} stroke="#5A3E28" stroke-width="1.5" />
                      <circle cx={x} cy={86 + i} r={7 + i} fill="#C77B3E" />
                    </g>
                  ))}
                </g>
              )}
              {look.upper && (
                <g>
                  <rect x="66" y="44" width="80" height="40" rx="2" fill={look.upper} />
                  <path d="M106 44v40" stroke="#000" opacity="0.15" />
                  <path d="M100 74v6M112 74v6" stroke={kitchen === 'kitchen_oak' ? '#B89A6E' : '#E3C77A'} stroke-width="2" stroke-linecap="round" />
                </g>
              )}
              {!look.upper && kitchen !== 'kitchen_copper' && (
                <g>
                  <path d="M72 92h40" stroke="#6B5446" stroke-width="3" />
                  <rect x="78" y="80" width="8" height="12" rx="2" fill="#E7B55E" opacity="0.8" />
                  <rect x="92" y="83" width="7" height="9" rx="2" fill="#C4385A" opacity="0.8" />
                </g>
              )}
              <rect x="66" y="134" width="80" height="42" fill={look.base} />
              <path d="M106 138v34" stroke="#000" opacity="0.15" />
              <rect x="64" y="128" width="84" height="7" rx="2" fill={look.top} />
              {kitchen === 'kitchen_hotplate' && (
                <g>
                  <rect x="72" y="122" width="24" height="6" rx="1" fill="#2A2A2E" />
                  <path d="M102 128l2 -14h12l2 14z" fill="#C4385A" />
                  <path d="M116 116q6 0 4 7" stroke="#C4385A" stroke-width="2" fill="none" />
                </g>
              )}
              {kitchen === 'kitchen_copper' && (
                <g>
                  <path d="M80 128l-3 -6h18l-3 6zM79 122l2 -14h12l2 14zM82 108l5 -6 5 6z" fill="#E7B55E" />
                  <rect x="100" y="116" width="6" height="12" rx="1" fill="#C4385A" opacity="0.85" />
                </g>
              )}
              {kitchen === 'kitchen_oak' && (
                <g>
                  <rect x="74" y="122" width="22" height="6" rx="1" fill="#2A2A2E" />
                  <path d="M100 128v-10h6v10" fill="#7FA36B" />
                  <circle cx="103" cy="114" r="5" fill="#7FA36B" />
                </g>
              )}
              {kitchen === 'kitchen_avocado' && (
                <g>
                  <circle cx="126" cy="60" r="0" />
                  <rect x="74" y="120" width="22" height="8" rx="2" fill="#E07A2E" />
                  <circle cx="85" cy="117" r="3" fill="#E07A2E" />
                </g>
              )}
            </g>
          );
        })()}
        {fish.length > 0 && (
          <g transform={at(136, 128)}>
            <PetShape pet={fish[0]} />
          </g>
        )}

        {/* lighting */}
        {lamp === 'lamp_brass' && (
          <g>
            <path d="M160 176v-72" stroke="#B8893E" stroke-width="3" />
            <ellipse cx="160" cy="175" rx="8" ry="2.5" fill="#B8893E" />
            <path d="M148 106h24l-5 -18h-14z" fill="#E7B55E" />
          </g>
        )}
        {lamp === 'lamp_paper' && (
          <g>
            <path d="M154 176l2 -10M166 176l-2 -10" stroke="#C9A574" stroke-width="2" />
            <rect x="151" y="104" width="18" height="64" rx="8" fill="#F6F0E2" />
            <rect x="151" y="104" width="18" height="64" rx="8" fill="#FFE7A8" opacity="0.35" />
          </g>
        )}
        {lamp === 'lamp_lava' && (
          <g>
            <rect x="150" y="150" width="20" height="26" rx="2" fill="#5A3E28" />
            <path d="M154 150l3 -30h6l3 30z" fill="#7B4FA0" />
            <ellipse cx="160" cy="140" rx="3" ry="4" fill="#E07A2E" />
            <circle cx="159" cy="128" r="2" fill="#E07A2E" />
          </g>
        )}
        {lamp === 'lamp_mosaic' && (
          <g>
            <path d="M160 0v62" stroke="#B8893E" stroke-width="1.5" />
            <circle cx="160" cy="74" r="13" fill="#E7B55E" opacity="0.18" />
            <path d="M152 64h16l4 10-4 10h-16l-4 -10z" fill="#2E8C9A" />
            <path d="M152 64l8 10-8 10M168 64l-8 10 8 10" stroke="#C4385A" stroke-width="2" fill="none" />
            <path d="M156 84l4 5 4 -5" fill="#B8893E" />
          </g>
        )}

        {/* window: a garden (and maybe a horse) outside, or the city */}
        <rect x="180" y="26" width="84" height="76" rx="6" fill="#1C2A3A" />
        <circle cx="244" cy="46" r="8" style={{ fill: 'var(--accent)' }} opacity="0.85" />
        {garden ? (
          <g>
            <rect x="180" y="82" width="84" height="20" fill="#2F4A33" />
            <circle cx="254" cy="76" r="9" fill="#2F5A3A" />
            {yard === 'garden_mangal' && (
              <g>
                <path d="M222 86h20l-3 6h-14z" fill="#2A2A2E" />
                <path d="M226 92l-3 8M238 92l3 8" stroke="#2A2A2E" stroke-width="2" />
                <path d="M228 82q-3 -6 1 -10M236 82q-3 -6 1 -10" stroke="#C9C9CF" stroke-width="1.5" fill="none" opacity="0.7" />
              </g>
            )}
            {yard === 'garden_fountain' && (
              <g>
                <ellipse cx="232" cy="94" rx="14" ry="3.5" fill="#E8E3DA" />
                <rect x="230" y="80" width="4" height="14" fill="#E8E3DA" />
                <ellipse cx="232" cy="80" rx="7" ry="2" fill="#E8E3DA" />
                <path d="M232 78q-6 -8 -9 4M232 78q6 -8 9 4" stroke="#9FD3E6" stroke-width="1.5" fill="none" />
              </g>
            )}
            {yard === 'garden_hammock' && (
              <g>
                <path d="M214 98v-24M246 98v-24" stroke="#6B4A2E" stroke-width="2.5" />
                <path d="M214 78q16 16 32 0" stroke="#E07A2E" stroke-width="4" fill="none" />
              </g>
            )}
            {horses.length > 0 && (
              <g transform={at(yard ? 246 : 228, 100, 0.6)}>
                <PetShape pet={horses[0]} />
              </g>
            )}
          </g>
        ) : (
          <path d="M180 102v-22h12v-10h14v18h10v-26h16v20h12v-8h12v28z" fill="#26364A" />
        )}
        <rect x="180" y="26" width="84" height="76" rx="6" fill="none" stroke="#6B5446" stroke-width="6" />
        <path d="M222 26v76M180 62h84" stroke="#6B5446" stroke-width="4" />
        <rect x="174" y="100" width="96" height="6" rx="2" fill="#6B5446" />
        {plant === 'plant_cactus' && (
          <g>
            <rect x="186" y="90" width="12" height="10" rx="2" fill="#B5643A" />
            <rect x="189" y="74" width="6" height="17" rx="3" fill="#4FA46D" />
            <path d="M189 82h-3v-5M195 80h3v-4" stroke="#4FA46D" stroke-width="3" fill="none" stroke-linecap="round" />
          </g>
        )}
        {plant === 'plant_tulips' && (
          <g>
            <path d="M184 100l2 -14h10l2 14z" fill="#2E8C9A" />
            <path d="M187 86l-3 -12M191 86v-14M195 86l3 -12" stroke="#4FA46D" stroke-width="1.5" />
            <path d="M181 74q3 -6 6 0zM188 72q3 -6 6 0zM195 74q3 -6 6 0z" fill="#C4385A" />
          </g>
        )}
        {plant === 'plant_fig' && (
          <g>
            <rect x="184" y="88" width="16" height="12" rx="2" fill="#EDE6DA" />
            <path d="M192 88v-22" stroke="#6B4A2E" stroke-width="1.5" />
            <ellipse cx="186" cy="74" rx="5" ry="8" fill="#3E8E5C" transform="rotate(-25 186 74)" />
            <ellipse cx="198" cy="70" rx="5" ry="8" fill="#4FA46D" transform="rotate(25 198 70)" />
            <ellipse cx="192" cy="62" rx="5" ry="8" fill="#3E8E5C" />
          </g>
        )}
        {cats.length > 1 && (
          <g transform={at(250, 101, 0.6)}>
            <PetShape pet={cats[1]} />
          </g>
        )}

        {/* seating */}
        {sofa === 'sofa_sedir' ? (
          <g>
            {[0, 1, 2, 3].map((i) => (
              <rect key={i} x={176 + i * 24} y="122" width="22" height="30" rx="6" fill={['#B4304A', '#E7B55E', '#2E8C9A', '#B4304A'][i]} />
            ))}
            <rect x="170" y="148" width="104" height="22" rx="4" fill="#8E2C2C" />
            <path d="M170 152h104" stroke="#E7B55E" stroke-width="2" />
            <rect x="172" y="168" width="100" height="8" fill="#5A3E28" />
          </g>
        ) : sofa === 'sofa_linen' ? (
          <g>
            <path d="M180 176l2 -8M264 176l-2 -8" stroke="#C9A574" stroke-width="3" />
            <rect x="176" y="120" width="92" height="30" rx="4" fill="#C3C7C2" />
            <rect x="176" y="142" width="92" height="26" rx="4" fill="#B2B7B1" />
            <rect x="170" y="132" width="12" height="36" rx="3" fill="#A6ABA5" />
            <rect x="262" y="132" width="12" height="36" rx="3" fill="#A6ABA5" />
            <rect x="196" y="128" width="18" height="16" rx="3" fill="#E7B55E" />
          </g>
        ) : sofa ? (
          <g>
            <rect x="176" y="136" width="92" height="38" rx="10" fill={sofa === 'sofa_velvet' ? '#7B4FA0' : '#5AB3A2'} />
            <rect x="176" y="118" width="92" height="30" rx="10" fill={sofa === 'sofa_velvet' ? '#8F63B5' : '#6CC7B5'} />
            <rect x="168" y="128" width="16" height="46" rx="8" fill={sofa === 'sofa_velvet' ? '#6A4190' : '#4FA493'} />
            <rect x="260" y="128" width="16" height="46" rx="8" fill={sofa === 'sofa_velvet' ? '#6A4190' : '#4FA493'} />
          </g>
        ) : (
          <rect x="192" y="152" width="60" height="22" rx="4" fill="#8A6A52" aria-label={T('An old crate')} />
        )}

        {/* the bird cage hangs from the ceiling over the clock */}
        {birds.length > 0 && (
          <g>
            <path d="M293 0v10" stroke="#B8893E" stroke-width="1.5" />
            <path d="M281 52v-28a12 12 0 0 1 24 0v28z" fill="#F5EEE6" opacity="0.08" />
            <g transform={at(293, 48)}>
              <PetShape pet={birds[0]} />
            </g>
            <path d="M281 52v-28a12 12 0 0 1 24 0v28M287 52v-37M293 52v-40M299 52v-37M279 52h28" stroke="#B8893E" stroke-width="1.2" fill="none" />
          </g>
        )}
        {heirlooms.includes('clock') && (
          <g aria-label={T('Heirloom clock')}>
            <rect x="280" y="68" width="26" height="108" rx="4" fill="#6B4A2E" />
            <circle cx="293" cy="90" r="9" fill="#F5EEE6" />
            <path d="M293 90v-6M293 90l4 2" stroke={INK} stroke-width="1.8" stroke-linecap="round" />
            <circle cx="293" cy="146" r="4.5" style={{ fill: 'var(--accent)' }} />
          </g>
        )}

        {/* wall art, TV and the piano (or a low cabinet) in one column */}
        {art === 'art_print' && (
          <g>
            <rect x="320" y="24" width="52" height="40" rx="3" fill="#F5EEE6" stroke="#6B4A2E" stroke-width="4" />
            <path d="M325 59l12 -14 8 8 7 -7 15 13z" style={{ fill: 'var(--stat-smarts)' }} />
          </g>
        )}
        {art === 'art_calligraphy' && (
          <g>
            <rect x="318" y="22" width="56" height="42" rx="2" fill="#1F4A3A" stroke="#E7B55E" stroke-width="3" />
            <path d="M326 52q8 -18 16 -4t14 -8q6 -6 10 6M330 40q10 4 22 -6" stroke="#E7B55E" stroke-width="2" fill="none" stroke-linecap="round" />
          </g>
        )}
        {art === 'art_botanical' && (
          <g>
            <rect x="324" y="20" width="44" height="48" fill="#F7F4EE" stroke="#2A2A2E" stroke-width="2" />
            <path d="M346 62v-34M346 50q-10 -4 -10 -12q8 0 10 8M346 42q10 -4 10 -12q-8 0 -10 8" stroke="#2A2A2E" stroke-width="1.3" fill="none" />
          </g>
        )}
        {art === 'art_sunburst' && (
          <g>
            {Array.from({ length: 16 }, (_, i) => {
              const a = (i / 16) * Math.PI * 2;
              return <path key={i} d={`M${346 + Math.cos(a) * 12} ${44 + Math.sin(a) * 12}L${346 + Math.cos(a) * 24} ${44 + Math.sin(a) * 24}`} stroke="#D9A322" stroke-width="2.5" stroke-linecap="round" />;
            })}
            <circle cx="346" cy="44" r="12" fill="#BFD3DA" stroke="#D9A322" stroke-width="2.5" />
          </g>
        )}
        {tv === 'tv_flat' && (
          <g>
            <rect x="318" y="76" width="56" height="34" rx="2" fill="#151017" />
            <rect x="321" y="79" width="50" height="28" fill="#2A3A5A" />
            <path d="M324 104l12 -10 8 6 10 -8 14 12z" fill="#3A5A8A" opacity="0.7" />
          </g>
        )}
        {piano ? (
          <g>
            <rect x="314" y="124" width="64" height="52" rx="3" fill="#151017" />
            <rect x="318" y="144" width="56" height="8" fill="#F5EEE6" />
            <path d="M324 144v5M330 144v5M340 144v5M346 144v5M352 144v5M362 144v5M368 144v5" stroke="#151017" stroke-width="2.5" />
          </g>
        ) : (
          (tv || art) && (
            <g>
              <rect x="316" y="150" width="60" height="26" rx="3" fill={tv === 'tv_tube' ? '#8A5A2E' : '#5A3E28'} />
              <path d="M346 154v18" stroke="#000" opacity="0.2" />
            </g>
          )
        )}
        {tv === 'tv_tube' && (
          <g transform={piano ? 'translate(0 -26)' : undefined}>
            <path d="M336 118l-8 -14M356 118l8 -14" stroke="#9A9AA2" stroke-width="1.5" />
            <rect x="324" y="118" width="44" height="32" rx="4" fill="#8A5A2E" />
            <rect x="328" y="122" width="28" height="24" rx="5" fill="#7E8C86" />
            <circle cx="362" cy="128" r="2" fill="#E7B55E" />
            <circle cx="362" cy="136" r="2" fill="#E7B55E" />
          </g>
        )}

        {/* shelves, right */}
        {shelf === 'shelf_books' && (
          <g>
            <rect x="386" y="56" width="46" height="120" rx="3" fill="#5A3E28" />
            {[66, 98, 130].map((y) => (
              <g key={y}>
                <rect x="390" y={y} width="8" height="24" fill="#C4385A" />
                <rect x="400" y={y + 4} width="7" height="20" fill="#2F5BD3" />
                <rect x="409" y={y} width="9" height="24" fill="#E7B55E" />
                <rect x="420" y={y + 6} width="7" height="18" fill="#5AB3A2" transform={`rotate(-10 ${423} ${y + 24})`} />
                <rect x="388" y={y + 24} width="42" height="3" fill="#3E2A1A" />
              </g>
            ))}
          </g>
        )}
        {shelf === 'shelf_walnut' && (
          <g>
            <rect x="384" y="50" width="50" height="126" rx="4" fill="#5A3A22" />
            <path d="M384 50l25 -8 25 8z" fill="#5A3A22" />
            <rect x="389" y="58" width="40" height="70" fill="#BFD3DA" opacity="0.35" />
            <path d="M409 58v70M389 92h40" stroke="#5A3A22" stroke-width="2" />
            {[393, 400, 413, 420].map((x) => (
              <path key={x} d={`M${x} 88l-1 -10h6l-1 10z`} fill="#C4385A" opacity="0.8" />
            ))}
            <circle cx="399" cy="114" r="7" fill="#F5EEE6" stroke="#2E8C9A" stroke-width="2" />
            <circle cx="419" cy="114" r="7" fill="#F5EEE6" stroke="#2E8C9A" stroke-width="2" />
            <rect x="389" y="134" width="40" height="36" fill="#4A2E1A" />
          </g>
        )}
        {shelf === 'shelf_ladder' && (
          <g>
            <path d="M392 176l12 -118M428 176l-6 -118" stroke="#D9B98C" stroke-width="4" />
            {[[400, 84, 26], [396, 116, 32], [392, 148, 38]].map(([x, y, w]) => (
              <rect key={y} x={x} y={y} width={w} height="4" fill="#D9B98C" />
            ))}
            <rect x="404" y="70" width="10" height="14" rx="2" fill="#EDE6DA" />
            <circle cx="409" cy="66" r="6" fill="#4FA46D" />
            <rect x="400" y="98" width="6" height="18" fill="#9BA3A6" />
            <rect x="408" y="102" width="6" height="14" fill="#E7B55E" />
            <rect x="398" y="134" width="22" height="14" rx="3" fill="#F2EFEA" />
          </g>
        )}
        {heirlooms.includes('trophy') && (
          <g transform={shelf ? undefined : 'translate(0 14)'}>
            {!shelf && <rect x="398" y="54" width="22" height="3" fill="#6B4A2E" />}
            <path d="M401 34h16v8a8 8 0 0 1-16 0zM407 50h4v4h-4zM403 52h12v3h-12z" fill="#E7B55E" transform={shelf === 'shelf_walnut' ? 'translate(0 -10)' : 'translate(0 2)'} />
          </g>
        )}

        {/* empty spots are sketched in dashes: a place waiting for something (round 4: the room looked bare) */}
        <g class="ghost" fill="none" stroke-width="1.6" stroke-dasharray="4 4" stroke-linecap="round" style={{ stroke: 'var(--muted)' }} opacity="0.4">
          {!lamp && <path d="M148 106h24l-5-18h-14zM160 106v68M152 175h16" />}
          {!rug && <ellipse cx="214" cy="226" rx="84" ry="15" />}
          {!bed && <path d="M8 230h112v18H8zM14 222h26v8" />}
          {!desk && <path d="M346 206h88M352 206v44M428 206v44" />}
        </g>

        {/* foreground: rug, bed, desk, pet corner and pets */}
        {rug === 'rug_kilim' && (
          <g>
            <ellipse cx="214" cy="226" rx="84" ry="15" fill="#A8323E" />
            <ellipse cx="214" cy="226" rx="72" ry="11" fill="none" stroke="#E7B55E" stroke-width="2" />
            {[-48, -24, 0, 24, 48].map((dx) => (
              <path key={dx} d={`M${214 + dx} 219l7 7-7 7-7 -7z`} fill={dx % 48 ? '#2E3A6A' : '#E7B55E'} />
            ))}
          </g>
        )}
        {rug === 'rug_wool' && (
          <g>
            <ellipse cx="214" cy="226" rx="84" ry="15" fill="#E6E1D6" />
            <ellipse cx="214" cy="226" rx="64" ry="11" fill="none" stroke="#9BA3A6" stroke-width="3" />
            <ellipse cx="214" cy="226" rx="40" ry="7" fill="none" stroke="#9BA3A6" stroke-width="3" />
          </g>
        )}
        {rug === 'rug_shag' && (
          <g>
            <ellipse cx="214" cy="226" rx="84" ry="15" fill="#E07A2E" />
            {Array.from({ length: 22 }, (_, i) => (
              <path key={i} d={`M${148 + i * 6} ${222 + (i % 3) * 3}l2 4`} stroke="#B85A1E" stroke-width="1.5" stroke-linecap="round" />
            ))}
          </g>
        )}

        {bed === 'bed_mattress' && (
          <g>
            <rect x="8" y="230" width="112" height="18" rx="6" fill="#EDE6DD" />
            <rect x="8" y="242" width="112" height="6" rx="3" fill="#C9C0B4" />
            <rect x="14" y="222" width="26" height="12" rx="5" fill="#F7F4EE" />
            <path d="M50 230h66v8h-66z" fill="#6FA8DC" opacity="0.8" />
          </g>
        )}
        {bed === 'bed_platform' && (
          <g>
            <rect x="8" y="196" width="8" height="58" rx="2" fill="#C9A574" />
            <rect x="8" y="234" width="116" height="14" rx="2" fill="#D9B98C" />
            <path d="M16 248v6M116 248v6" stroke="#C9A574" stroke-width="4" />
            <rect x="16" y="222" width="106" height="14" rx="4" fill="#F7F4EE" />
            <rect x="18" y="214" width="26" height="12" rx="5" fill="#FFFFFF" />
            <rect x="50" y="220" width="72" height="16" rx="5" fill="#9DB3A0" />
          </g>
        )}
        {bed === 'bed_water' && (
          <g>
            <rect x="8" y="200" width="10" height="52" rx="3" fill="#6B4A2E" />
            <rect x="8" y="232" width="116" height="20" rx="3" fill="#6B4A2E" />
            <path d="M18 232q12 -10 24 0t24 0t24 0t24 0v-8h-96z" fill="#4D8FBF" />
            <rect x="22" y="212" width="26" height="12" rx="5" fill="#E07A2E" />
          </g>
        )}

        {desk === 'desk_fold' && (
          <g>
            <rect x="350" y="206" width="80" height="5" rx="1" fill="#9A9AA2" />
            <path d="M356 211l18 40M374 211l-18 40M424 211l-18 40M406 211l18 40" stroke="#7A7A82" stroke-width="2.5" />
            <path d="M382 206l4 -16h24l-2 16z" fill="#2A2A2E" />
          </g>
        )}
        {desk === 'desk_oak' && (
          <g>
            <rect x="346" y="206" width="88" height="6" rx="2" fill="#D9B98C" />
            <path d="M352 212v40M428 212v40" stroke="#C9A574" stroke-width="4" />
            <rect x="404" y="212" width="24" height="18" fill="#D9B98C" />
            <path d="M374 206l3 -14h24l-1 14z" fill="#E8E8EC" />
            <path d="M360 206v-18l8 -6" stroke="#2A2A2E" stroke-width="1.5" fill="none" />
            <path d="M364 182l8 2-3 6z" fill="#2A2A2E" />
            <rect x="414" y="196" width="10" height="10" rx="2" fill="#EDE6DA" />
            <circle cx="419" cy="192" r="5" fill="#4FA46D" />
          </g>
        )}
        {desk === 'desk_inlay' && (
          <g>
            <rect x="348" y="204" width="84" height="16" rx="3" fill="#4A2E1A" />
            {[358, 372, 386, 400, 414].map((x) => (
              <path key={x} d={`M${x} 212l4 -4 4 4-4 4z`} fill="#F5EEE6" opacity="0.85" />
            ))}
            <path d="M354 220q-4 16 2 32M426 220q4 16 -2 32" stroke="#4A2E1A" stroke-width="4" fill="none" />
            <rect x="368" y="194" width="22" height="10" rx="1" fill="#8E2C2C" />
            <circle cx="404" cy="200" r="4" fill="#2A2A2E" />
            <path d="M406 198l8 -12" stroke="#F5EEE6" stroke-width="1.2" />
          </g>
        )}

        {petbed === 'bed_cat' && (
          <g>
            <ellipse cx="290" cy="240" rx="24" ry="8" fill="#8C4F5E" />
            <ellipse cx="290" cy="237" rx="18" ry="5" fill="#A66474" />
          </g>
        )}
        {petbed === 'petbed_basket' && (
          <g>
            <path d="M266 232h48l-4 14h-40z" fill="#C9A16A" />
            <path d="M272 232l4 14M282 232l2 14M292 232v14M302 232l-2 14M310 232l-4 14" stroke="#A8824E" stroke-width="1.2" />
            <ellipse cx="290" cy="232" rx="24" ry="4" fill="#E8DCC8" />
          </g>
        )}

        {turtles.length > 0 && (
          <g transform={at(146, 252, 1.1)}>
            <PetShape pet={turtles[0]} />
          </g>
        )}
        {dogs.length > 0 && (
          <g transform={at(182, 240)}>
            <PetShape pet={dogs[0]} />
          </g>
        )}
        {dogs.length > 1 && (
          <g transform={at(236, 242, 0.7)}>
            <PetShape pet={dogs[1]} />
          </g>
        )}
        {cats.length > 0 && (
          <g transform={petbed ? at(290, 236) : at(288, 244)}>
            <PetShape pet={cats[0]} />
          </g>
        )}
        {rabbits.length > 0 && (
          <g transform={at(330, 250)}>
            <PetShape pet={rabbits[0]} />
          </g>
        )}
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------- screen

function FurnitureRow({ app, f, garden, showSet }: { app: AppApi; f: FurnitureDef; garden: boolean; showSet: boolean }) {
  const s = app.game!;
  const p = s.player;
  const owned = p.home.furniture.includes(f.id);
  const price = furniturePrice(s, f.id);
  const needsGarden = f.slot === 'garden' && !garden;
  const set = STYLE_SETS.find((x) => x.id === f.set);
  return (
    <div class={`furn${owned ? ' owned' : ''}`}>
      <div class="furn-pic">
        <FurnitureArt f={f} owned={owned} size={52} />
        {owned && (
          <span class="furn-placed" aria-hidden="true">
            <Icon name="check" size={12} />
          </span>
        )}
      </div>
      <div class="furn-name">{app.lang === 'tr' ? f.nameTr : f.name}</div>
      <div class="furn-sub">
        {T('+{n} Happiness', { n: f.happiness })}
        {set && showSet && ` · ${app.lang === 'tr' ? set.nameTr : set.name}`}
      </div>
      <button
        type="button"
        class="btn small furn-buy"
        disabled={owned || needsGarden || p.money < price || p.jailYears > 0}
        onClick={() => app.act((g) => void buyFurniture(g, f.id))}
      >
        {owned ? T('Placed') : needsGarden ? T('Needs a garden') : fmtMoney(price, p.countryId, app.lang)}
      </button>
    </div>
  );
}

function PetRow({ app, pet }: { app: AppApi; pet: Pet }) {
  const s = app.game!;
  const age = petAge(pet, s.year);
  const older = pet.birthYear < s.player.birthYear;
  return (
    <div class="item">
      <div class="icon-box">
        <PetIcon pet={pet} />
      </div>
      <div class="grow" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div class="row between" style={{ gap: '8px' }}>
          <div class="item-title">{displayName(pet, app.lang)}</div>
          {(pet.tricks ?? 0) > 0 && <span class="chip">{Tn(pet.tricks ?? 0, '{n} trick', '{n} tricks')}</span>}
        </div>
        <div class="item-sub">
          {kindLabel(pet.kind, app.lang)} · {Tn(age, '{n} year old', '{n} years old')}
          {older && ` · ${T('Family pet')}`}
        </div>
        <div class="bar" role="meter" aria-label={T('Closeness')} aria-valuenow={pet.closeness} aria-valuemin={0} aria-valuemax={100}>
          <div style={{ width: `${pet.closeness}%`, background: pet.closeness < 25 ? 'var(--bad)' : 'var(--accent)' }} />
        </div>
      </div>
    </div>
  );
}

export function Home({ app }: { app: AppApi }) {
  const s = app.game!;
  const p = s.player;
  const [view, setView] = useState<'room' | 'style'>('room');
  const tierId = currentTier(p);
  const tier = homeTier(tierId);
  const garden = !!tier?.garden;
  const title = p.ext?.house ? homeTitle(tierId, p.city, app.lang) : T(p.home.name);
  const pets = alivePets(p);
  const remembered = petsOf(p).filter((x) => !x.alive && !x.gone);

  const groups =
    view === 'room'
      ? SLOTS.map((sl) => ({ key: sl.id, label: app.lang === 'tr' ? sl.nameTr : sl.name, items: FURNITURE.filter((f) => f.slot === sl.id), note: '' }))
      : [
          ...STYLE_SETS.map((st) => {
            const prog = setProgress(p.home.furniture, st.id, garden);
            return { key: st.id, label: app.lang === 'tr' ? st.nameTr : st.name, items: FURNITURE.filter((f) => f.set === st.id), note: `${prog.have}/${prog.total}` };
          }),
          { key: 'basics', label: T('Basics'), items: FURNITURE.filter((f) => !f.set), note: '' },
        ];

  return (
    <div class="screen">
      <div class="row between" style={{ alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div class="eyebrow">
            {p.city}
            {tierId !== 'parents' && ` · ${p.home.owned ? T('Homeowner') : T('Renting')}`}
          </div>
          <h1 class="title-xl">{title}</h1>
        </div>
        {p.home.owned && (
          <div style={{ textAlign: 'right' }}>
            <div class="eyebrow">{T('Value')}</div>
            <div class="num" style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '18px' }}>
              {fmtMoney(p.home.value, p.countryId, app.lang)}
            </div>
          </div>
        )}
      </div>

      <Room items={p.home.furniture} heirlooms={s.dynasty.heirlooms.map((h) => h.defId)} pets={pets} garden={garden} />

      <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div class="section-head">
          <h2 class="title-l">{T('Pets')}</h2>
          <span class="muted" style={{ fontSize: '13px' }}>
            {T('They stay with the house')}
          </span>
        </div>
        {pets.length === 0 && <div class="card tight muted">{T('No pets yet. Adopt one from Activities.')}</div>}
        <div class="list">
          {pets.map((pet) => (
            <PetRow key={pet.id} app={app} pet={pet} />
          ))}
        </div>
        {remembered.length > 0 && (
          <div class="muted" style={{ fontSize: '13px' }}>
            {T('In memory: {names}', { names: remembered.map((x) => displayName(x, app.lang)).join(', ') })}
          </div>
        )}
      </section>

      <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div class="section-head">
          <h2 class="title-l">{T('Heirlooms')}</h2>
          <span class="muted" style={{ fontSize: '13px' }}>
            {T('Passed down, never sold')}
          </span>
        </div>
        {s.dynasty.heirlooms.length === 0 && <div class="card tight muted">{T('No heirlooms yet. Win a trophy, or keep something special long enough.')}</div>}
        <div class="list">
          {s.dynasty.heirlooms.map((h) => {
            const def = heirloomDef(h.defId);
            return (
              <div class="item" key={h.uid}>
                <div class="icon-box">
                  <Icon name={def.icon} />
                </div>
                <div class="grow">
                  <div class="item-title">{h.name}</div>
                  <div class="item-sub">
                    {Tn(h.generations, 'Since {y} · {n} generation', 'Since {y} · {n} generations', { y: h.sinceYear })}
                  </div>
                  <div class="item-sub" style={{ marginTop: '4px' }}>
                    {h.story[h.story.length - 1]}
                  </div>
                </div>
                <span class="chip accent" style={{ whiteSpace: 'normal', textAlign: 'right', maxWidth: '96px' }}>
                  {app.lang === 'tr' ? def.effectTr : def.effect}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div class="section-head">
          <h2 class="title-l">{T('Decorate')}</h2>
          <span class="muted num" style={{ fontSize: '13px' }}>
            {T('Bank {m}', { m: fmtMoney(p.money, p.countryId, app.lang) })}
          </span>
        </div>
        <div class="seg" role="group" aria-label={T('Group furniture')}>
          <button type="button" aria-pressed={view === 'room'} onClick={() => setView('room')}>
            {T('By room')}
          </button>
          <button type="button" aria-pressed={view === 'style'} onClick={() => setView('style')}>
            {T('By style')}
          </button>
        </div>
        {view === 'style' && <div class="muted" style={{ fontSize: '13px' }}>{T('Complete a style set for +1 Happiness every year.')}</div>}
        {groups.map((g) => (
          <div key={g.key} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div class="row between">
              <div class="eyebrow">{g.label}</div>
              {g.note && <span class="chip accent num">{g.note}</span>}
            </div>
            <div class="furn-grid">
              {g.items.map((f) => (
                <FurnitureRow key={f.id} app={app} f={f} garden={garden} showSet={view === 'room'} />
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
