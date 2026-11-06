/**
 * Which milestone scene illustrates which event. Exact ids first, then regex patterns.
 * Scene ids live in ./scenes.tsx. Events without a scene render as before (text only).
 */

export const SCENE_BY_EVENT: Record<string, string> = {
  // birth and naming
  'base.baby_name': 'birth',
  'base.ad_first_word': 'newborn',
  'base.ad_newborn_nights': 'newborn',
  'base.elder_grandbaby': 'newborn',
  // school start
  'base.ch_kindergarten': 'first_day_school',
  'base.ad_first_school_day': 'first_day_school',
  'base.ch_homework': 'first_day_school',
  'tr.karne': 'first_day_school',
  // graduations
  'base.grad_party': 'graduation',
  'base.kid_graduates': 'graduation',
  'base.ad_old_gk_graduation': 'graduation',
  'base.ya_teacher_retires': 'graduation',
  'base.after_highschool': 'graduation',
  'campus.after_grad': 'graduation',
  'campus.honorary': 'graduation',
  // first job
  'base.job_board': 'first_job',
  'base.ya_first_day': 'first_job',
  'base.first_interview': 'first_job',
  'base.ad_kid_first_job': 'first_job',
  'base.first_salary': 'first_job',
  // love and weddings
  'base.proposal': 'proposal',
  'base.job_pilot_proposal': 'proposal',
  'base.ch_cousin_wedding': 'wedding',
  'tr.kina': 'wedding',
  'tr.dugun_salonu': 'wedding',
  'tr.torun_dugun': 'wedding',
  'uk.marquee_wedding': 'wedding',
  // empty nest
  'base.empty_nest': 'empty_nest',
  'base.moving_out': 'empty_nest',
  // wills and inheritance
  'base.will': 'inheritance',
  'base.ad_will_surprise': 'inheritance',
  'base.inheritance_far': 'inheritance',
  'base.elder_house_heir': 'inheritance',
  // retirement
  'base.retirement': 'retirement',
  'base.retirement_trip': 'retirement',
  'base.gb_retire': 'retirement',
  'base.ad_spouse_retires': 'retirement',
  'base.ab_retire_home': 'retirement',
  'us.retirement_401k': 'retirement',
  // handing things down
  'fame.pass_torch': 'pass_the_torch',
  'base.hl_teach': 'pass_the_torch',
  'base.hl_child_asks': 'pass_the_torch',
  'base.early8_grand_keepsake': 'pass_the_torch',
  // the end of a life
  'base.ad_old_funeral_plan': 'final_words',
  'base.elder_memoir_done': 'final_words',
  'base.elder_record_stories': 'final_words',
  'base.hlf_letters': 'final_words',
  // family album
  'base.heirloom_story': 'family_portrait',
  'base.ch_family_history': 'family_portrait',
  'base.elder_gk_wedding': 'wedding',
  'base.hl_keeper_note': 'family_portrait',
  'boss.portrait': 'family_portrait',
  // museum
  'tr.mine_museum': 'museum_card',
  'base.appraisal': 'museum_card',
  'base.hl_appraise': 'museum_card',
  'fame.trophy_auction': 'museum_card',
};

/** Checked in order after the exact table. */
export const SCENE_PATTERNS: [RegExp, string][] = [
  [/(?<!ex_)wedding/, 'wedding'],
  [/(^|\.)ad_inherit_/, 'inheritance'],
  [/graduat/, 'graduation'],
  [/(^|\.)newborn|_crib_|nursery/, 'newborn'],
  [/(^|\.)pass_torch|torch/, 'pass_the_torch'],
];

export function sceneFor(eventId: string, _category?: string): string | null {
  if (!eventId) return null;
  const hit = SCENE_BY_EVENT[eventId];
  if (hit) return hit;
  for (const [re, scene] of SCENE_PATTERNS) if (re.test(eventId)) return scene;
  return null;
}
