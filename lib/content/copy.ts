/**
 * Every piece of public-site text that is edited from Admin → Site content, declared once.
 * This list drives: the defaults, the server-side validation, the admin form and the TypeScript
 * type of `SiteContent` — so adding an editable text is one line here plus using it on a page.
 *
 * (The homepage hero, studio quote, team heading, About opening and design pillars predate this
 * list and have their own, richer editors; they are not repeated here.)
 */

export type CopyKind = 'text' | 'textarea' | 'image';

export interface CopyField {
  key: string;
  label: string;
  kind: CopyKind;
  max: number;
  default: string;
  hint?: string;
}

export interface CopyGroup {
  /** Which tab of the admin page shows this group. */
  tab: 'home' | 'pages' | 'about' | 'footer';
  title: string;
  description?: string;
  fields: readonly CopyField[];
}

export const COPY_GROUPS = [
  // ---------------------------------------------------------------- Homepage
  {
    tab: 'home',
    title: 'Hero buttons',
    description: 'The two buttons under the introduction, and the hint at the bottom.',
    fields: [
      { key: 'heroPrimaryCta', label: 'First button', kind: 'text', max: 40, default: 'See our projects' },
      { key: 'heroPrimaryHref', label: 'Where the first button goes', kind: 'text', max: 200, default: '/projects', hint: 'A page of this site such as /projects, or a full https:// link.' },
      { key: 'heroSecondaryCta', label: 'Second button', kind: 'text', max: 40, default: 'About us' },
      { key: 'heroSecondaryHref', label: 'Where the second button goes', kind: 'text', max: 200, default: '/about', hint: 'A page of this site such as /about, or a full https:// link.' },
      { key: 'heroScrollCue', label: 'Scroll hint', kind: 'text', max: 60, default: 'Scroll to see our work' },
    ],
  },
  {
    tab: 'home',
    title: 'Process scroll',
    description: 'The scroll section after the introduction: five features that take turns as you scroll, each with its own drawing.',
    fields: [
      { key: 'featuresCta', label: 'Button on every feature', kind: 'text', max: 30, default: 'See it in our work' },
      { key: 'featuresCtaHref', label: 'Where the button goes', kind: 'text', max: 200, default: '/projects', hint: 'A page of this site such as /projects, or a full https:// link.' },
      { key: 'featuresHint', label: 'Handwritten hint under the first feature', kind: 'text', max: 40, default: 'explore our process' },
      { key: 'feature1Note', label: 'Feature 1 — handwritten tag', kind: 'text', max: 40, default: 'Brief, understood!' },
      { key: 'feature1Title', label: 'Feature 1 — heading', kind: 'text', max: 30, default: 'Concept Sketch' },
      { key: 'feature1Text', label: 'Feature 1 — text', kind: 'textarea', max: 220, default: 'Rough lines, site notes and spatial diagrams become a clear design direction.' },
      { key: 'feature2Note', label: 'Feature 2 — handwritten tag', kind: 'text', max: 40, default: 'Ideas, shaped!' },
      { key: 'feature2Title', label: 'Feature 2 — heading', kind: 'text', max: 30, default: 'Massing Studies' },
      { key: 'feature2Text', label: 'Feature 2 — text', kind: 'textarea', max: 220, default: 'Volumes, courtyards and heights tested against light, climate and the city.' },
      { key: 'feature3Note', label: 'Feature 3 — handwritten tag', kind: 'text', max: 40, default: 'Plans, resolved!' },
      { key: 'feature3Title', label: 'Feature 3 — heading', kind: 'text', max: 30, default: 'Planning & Layout' },
      { key: 'feature3Text', label: 'Feature 3 — text', kind: 'textarea', max: 220, default: 'Floor plans developed room by room, with circulation, structure and services in one drawing.' },
      { key: 'feature4Note', label: 'Feature 4 — handwritten tag', kind: 'text', max: 40, default: 'Details, refined!' },
      { key: 'feature4Title', label: 'Feature 4 — heading', kind: 'text', max: 30, default: 'Technical Drawing' },
      { key: 'feature4Text', label: 'Feature 4 — text', kind: 'textarea', max: 220, default: 'Every junction, section and schedule marked up, coordinated and ready to build.' },
      { key: 'feature5Note', label: 'Feature 5 — handwritten tag', kind: 'text', max: 40, default: 'Form, realised!' },
      { key: 'feature5Title', label: 'Feature 5 — heading', kind: 'text', max: 30, default: 'Facade Design' },
      { key: 'feature5Text', label: 'Feature 5 — text', kind: 'textarea', max: 220, default: 'Screens, fins and openings explored until the elevation feels exactly right.' },
    ],
  },
  {
    tab: 'home',
    title: 'Letter from the studio',
    description: 'A letter on a sheet of paper whose words darken as you scroll.',
    fields: [
      { key: 'letterEyebrow', label: 'Handwritten note above the heading', kind: 'text', max: 40, default: 'A note from the studio' },
      { key: 'letterTitle', label: 'Heading', kind: 'text', max: 70, default: 'Cities are drawn before they are built.' },
      { key: 'letterBody', label: 'Letter', kind: 'textarea', max: 1200, default: 'Every project we take on begins the same way: with a pencil, a site visit and a question about the people who will live there.\n\nSoftware can speed the work up, but it cannot decide what a street should feel like at dusk or how a courtyard should hold the heat of a Baghdad summer. That judgement still comes from walking the ground, listening, and drawing until the idea is clear.\n\nWe keep that habit at every scale, from a single villa to a district of thousands of homes, so that what reaches the site is something we have already lived with on paper.', hint: 'Leave a blank line between paragraphs.' },
      { key: 'letterSign', label: 'Signature', kind: 'text', max: 50, default: 'The CVI studio, Baghdad' },
    ],
  },
  {
    tab: 'home',
    title: 'Ways of working',
    description: 'Three folder cards describing how a project can begin with the studio.',
    fields: [
      { key: 'approachEyebrow', label: 'Small label above the heading', kind: 'text', max: 40, default: 'How we work' },
      { key: 'approachTitle', label: 'Heading', kind: 'text', max: 60, default: 'Three ways to begin' },
      { key: 'approachIntro', label: 'Line under the heading', kind: 'textarea', max: 220, default: 'Choose the stage you need us at. Each one stands on its own and can grow into the next.' },
      { key: 'approachBadge', label: 'Handwritten note on the middle card', kind: 'text', max: 30, default: 'most requested' },
      { key: 'approachCtaHref', label: 'Where the card buttons go', kind: 'text', max: 200, default: '/contact', hint: 'A page of this site such as /contact, or a full https:// link.' },
      { key: 'approach1Name', label: 'Card 1 — name', kind: 'text', max: 30, default: 'Concept' },
      { key: 'approach1Tag', label: 'Card 1 — one-line description', kind: 'text', max: 70, default: 'For early ideas and feasibility' },
      { key: 'approach1Items', label: 'Card 1 — what is included', kind: 'textarea', max: 400, default: 'Site and context reading\nMassing and layout options\nConcept sketches and diagrams\nArea schedule and first budget guidance\nPresentation to your stakeholders', hint: 'One item per line.' },
      { key: 'approach1Cta', label: 'Card 1 — button', kind: 'text', max: 30, default: 'Start with a concept' },
      { key: 'approach2Name', label: 'Card 2 — name', kind: 'text', max: 30, default: 'Design' },
      { key: 'approach2Tag', label: 'Card 2 — one-line description', kind: 'text', max: 70, default: 'From approved concept to full drawings' },
      { key: 'approach2Items', label: 'Card 2 — what is included', kind: 'textarea', max: 400, default: 'Architectural design development\nCoordinated BIM model\nStructural and services coordination\nFacade, interior and landscape detailing\nPermit and tender documents', hint: 'One item per line.' },
      { key: 'approach2Cta', label: 'Card 2 — button', kind: 'text', max: 30, default: 'Plan a full design' },
      { key: 'approach3Name', label: 'Card 3 — name', kind: 'text', max: 30, default: 'Delivery' },
      { key: 'approach3Tag', label: 'Card 3 — one-line description', kind: 'text', max: 70, default: 'Staying with the project on site' },
      { key: 'approach3Items', label: 'Card 3 — what is included', kind: 'textarea', max: 400, default: 'Site supervision visits\nContractor queries and shop-drawing review\nQuality and progress reports\nChange management\nHandover and as-built drawings', hint: 'One item per line.' },
      { key: 'approach3Cta', label: 'Card 3 — button', kind: 'text', max: 30, default: 'Talk about delivery' },
    ],
  },
  {
    tab: 'home',
    title: 'Questions and answers',
    description: 'The accordion of common questions near the end of the homepage.',
    fields: [
      { key: 'faqEyebrow', label: 'Handwritten note above the heading', kind: 'text', max: 40, default: 'Good to know' },
      { key: 'faqTitle', label: 'Heading', kind: 'text', max: 60, default: 'Questions we hear often' },
      { key: 'faqIntro', label: 'Line under the heading', kind: 'textarea', max: 220, default: 'Cannot find yours? Write to us and a director will reply.' },
      { key: 'faqCta', label: 'Button', kind: 'text', max: 30, default: 'Ask the studio' },
      { key: 'faqCtaHref', label: 'Where the button goes', kind: 'text', max: 200, default: '/contact' },
      { key: 'faq1Q', label: 'Question 1', kind: 'text', max: 100, default: 'Which kinds of projects do you take on?' },
      { key: 'faq1A', label: 'Answer 1', kind: 'textarea', max: 420, default: 'Masterplans, residential towers, educational and cultural buildings, offices, private villas and interiors. Most of our work is in Iraq.' },
      { key: 'faq2Q', label: 'Question 2', kind: 'text', max: 100, default: 'How long does a design take?' },
      { key: 'faq2A', label: 'Answer 2', kind: 'textarea', max: 420, default: 'It depends on scale. A villa concept can be ready in a few weeks; a masterplan or a tower usually runs for several months through concept, development and documentation. We give a clear timetable after the first meeting.' },
      { key: 'faq3Q', label: 'Question 3', kind: 'text', max: 100, default: 'Do you work with other consultants?' },
      { key: 'faq3A', label: 'Answer 3', kind: 'textarea', max: 420, default: 'Yes. We coordinate structural, mechanical, electrical and landscape consultants in one BIM model, and we are happy to work with the teams you already trust.' },
      { key: 'faq4Q', label: 'Question 4', kind: 'text', max: 100, default: 'Can you supervise construction?' },
      { key: 'faq4A', label: 'Answer 4', kind: 'textarea', max: 420, default: 'We can. Site supervision keeps the built result close to the drawings, and it is the part of the job where most quality is won or lost.' },
      { key: 'faq5Q', label: 'Question 5', kind: 'text', max: 100, default: 'How do we start?' },
      { key: 'faq5A', label: 'Answer 5', kind: 'textarea', max: 420, default: 'Send us a short brief from the contact page: the site, the programme and your timeline. A director reads every message and replies by email.' },
    ],
  },
  {
    tab: 'home',
    title: 'Small labels on the homepage',
    fields: [
      { key: 'showcaseLabel', label: 'Label above the framed project', kind: 'text', max: 40, default: 'Now showing' },
      { key: 'teamPhotoHint', label: 'Hint under the team photo (computer)', kind: 'text', max: 80, default: 'Hover over a person to meet them' },
      { key: 'teamPhotoHintTouch', label: 'Hint under the team photo (phone)', kind: 'text', max: 80, default: 'Swipe sideways, then tap a person to meet them' },
      { key: 'teamMoreLink', label: 'Link under the team', kind: 'text', max: 40, default: 'More about us' },
      { key: 'teamMoreHref', label: 'Where that link goes', kind: 'text', max: 200, default: '/about' },
    ],
  },
  {
    tab: 'home',
    title: 'Featured projects section',
    fields: [
      { key: 'featuredEyebrow', label: 'Small label', kind: 'text', max: 60, default: '01 • Featured projects' },
      { key: 'featuredTitle', label: 'Heading', kind: 'text', max: 80, default: 'Our featured work' },
      { key: 'featuredIntro', label: 'Short line on the right', kind: 'text', max: 200, default: 'Curated architectural case studies with high-density visual narratives.' },
      { key: 'cardCta', label: 'Link under each project', kind: 'text', max: 40, default: 'View project' },
      { key: 'cardScaleLabel', label: 'Label above the size', kind: 'text', max: 30, default: 'Built scale' },
      { key: 'cardPhaseLabel', label: 'Label above the phase', kind: 'text', max: 30, default: 'Phase' },
    ],
  },
  {
    tab: 'home',
    title: 'Studio quote section',
    fields: [{ key: 'manifestoEyebrow', label: 'Small label above the quote', kind: 'text', max: 60, default: 'Our belief' }],
  },
  {
    tab: 'home',
    title: 'Services section',
    description: 'The cards come from the Disciplines tab.',
    fields: [
      { key: 'servicesEyebrow', label: 'Small label', kind: 'text', max: 60, default: '02 • What we do' },
      { key: 'servicesTitle', label: 'Heading', kind: 'text', max: 80, default: 'Our services' },
      { key: 'servicesIntro', label: 'Short line on the right', kind: 'text', max: 200, default: 'Full-spectrum architectural delivery from schematic inception to structural coordination.' },
    ],
  },
  {
    tab: 'home',
    title: 'All-projects list',
    fields: [
      { key: 'archiveEyebrow', label: 'Small label', kind: 'text', max: 60, default: '04 • All work' },
      { key: 'archiveTitle', label: 'Heading', kind: 'text', max: 80, default: 'More projects' },
      { key: 'archiveLink', label: 'Link text', kind: 'text', max: 60, default: 'View all {count} projects', hint: '{count} is replaced by the number of projects.' },
    ],
  },

  // ---------------------------------------------------------- Other pages
  {
    tab: 'pages',
    title: 'Projects page',
    fields: [
      { key: 'projectsEyebrow', label: 'Small label', kind: 'text', max: 80, default: 'Portfolio • 2023 — 2026' },
      { key: 'projectsTitle', label: 'Heading', kind: 'text', max: 80, default: 'Architectural Works' },
      {
        key: 'projectsIntro',
        label: 'Introduction',
        kind: 'textarea',
        max: 500,
        default:
          'A curated selection of masterplans, residential towers, educational campuses and civic buildings designed across Iraq.',
      },
      { key: 'projectsSearchPlaceholder', label: 'Search box hint', kind: 'text', max: 60, default: 'Search projects...' },
      { key: 'projectsAllLabel', label: 'Label of the “show everything” filter', kind: 'text', max: 40, default: 'All types' },
    ],
  },
  {
    tab: 'pages',
    title: 'Individual project pages',
    description: 'Small texts that appear on every project page.',
    fields: [
      { key: 'projectBgDefault', label: 'Default background picture', kind: 'image', max: 500, default: '/baghdad-urban-map.jpg', hint: 'Used behind every project that has no background or cover picture of its own.' },
      { key: 'projectBackLabel', label: 'Link back to the list', kind: 'text', max: 40, default: 'All projects' },
      { key: 'projectReadCue', label: 'Hint under the title', kind: 'text', max: 40, default: 'Read the project' },
      { key: 'projectNextTitle', label: 'Heading before the next project', kind: 'text', max: 40, default: 'Continue exploring' },
      { key: 'projectNextLabel', label: 'Label on the next-project card', kind: 'text', max: 40, default: 'Next project' },
      { key: 'factClientLabel', label: 'Facts bar: client', kind: 'text', max: 30, default: 'Client' },
      { key: 'factLocationLabel', label: 'Facts bar: location', kind: 'text', max: 30, default: 'Location' },
      { key: 'factYearLabel', label: 'Facts bar: year', kind: 'text', max: 30, default: 'Year' },
      { key: 'factScaleLabel', label: 'Facts bar: scale', kind: 'text', max: 30, default: 'Scale / Area' },
      { key: 'factPhaseLabel', label: 'Facts bar: phase', kind: 'text', max: 30, default: 'Phase' },
      { key: 'factTypologyLabel', label: 'Facts bar: typology', kind: 'text', max: 30, default: 'Typology' },
    ],
  },
  {
    tab: 'pages',
    title: 'Contact page',
    fields: [
      { key: 'contactEyebrow', label: 'Small label', kind: 'text', max: 80, default: 'Contact us • Baghdad' },
      { key: 'contactTitle', label: 'Heading', kind: 'text', max: 80, default: 'Start a conversation' },
      {
        key: 'contactIntro',
        label: 'Introduction',
        kind: 'textarea',
        max: 500,
        default:
          'We welcome conversations with developers, civic leaders and private clients seeking architectural innovation and lasting quality.',
      },
      { key: 'contactAddressLabel', label: 'Address card title', kind: 'text', max: 40, default: 'PHYSICAL ATELIER' },
      { key: 'contactCoordsLabel', label: 'Word before the coordinates', kind: 'text', max: 30, default: 'COORDINATES' },
      { key: 'contactChannelsLabel', label: 'Contact details card title', kind: 'text', max: 40, default: 'DIRECT CHANNELS' },
      { key: 'contactPhoneLabel', label: 'Label above the phone number', kind: 'text', max: 40, default: 'TELEPHONE / WHATSAPP' },
      { key: 'contactEmailLabel', label: 'Label above the email', kind: 'text', max: 40, default: 'ELECTRONIC MAIL' },
      { key: 'contactInstagramLabel', label: 'Instagram link text', kind: 'text', max: 60, default: 'Instagram (@cvi.arch)' },
      { key: 'contactFacebookLabel', label: 'Facebook link text', kind: 'text', max: 60, default: 'Facebook (CVI Architects)' },
      { key: 'contactTwitterLabel', label: 'X / Twitter link text', kind: 'text', max: 60, default: 'X / Twitter (@CVIarch)' },
      { key: 'contactLinkedinLabel', label: 'LinkedIn link text', kind: 'text', max: 60, default: 'LinkedIn' },
      { key: 'contactMapTitle', label: 'Map description (for screen readers)', kind: 'text', max: 80, default: 'CVI Architects Location' },
    ],
  },
  {
    tab: 'pages',
    title: 'Contact form',
    description: 'Every word of the enquiry form, including the list of project types.',
    fields: [
      { key: 'formTitle', label: 'Heading', kind: 'text', max: 80, default: 'Send an Architectural Brief' },
      { key: 'formSubtitle', label: 'Line under the heading', kind: 'text', max: 80, default: 'Read by the studio directors' },
      { key: 'formNameLabel', label: 'Name field', kind: 'text', max: 40, default: 'Full name *' },
      { key: 'formEmailLabel', label: 'Email field', kind: 'text', max: 40, default: 'Email address *' },
      { key: 'formEmailPlaceholder', label: 'Email hint', kind: 'text', max: 60, default: 'name@organization.com' },
      { key: 'formTypeLabel', label: 'Project type field', kind: 'text', max: 40, default: 'Project type' },
      {
        key: 'formTypes',
        label: 'Project types to choose from',
        kind: 'textarea',
        max: 900,
        default: 'Masterplanning & Urban Design\nResidential High-Rise / Tower\nEducational or Academic Campus\nCommercial / Corporate HQ\nCultural or Religious Architecture\nBespoke Private Villa\nOther',
        hint: 'One per line. The first is selected by default.',
      },
      { key: 'formScaleLabel', label: 'Scale field', kind: 'text', max: 60, default: 'Estimated scale / location' },
      { key: 'formScalePlaceholder', label: 'Scale hint', kind: 'text', max: 60, default: 'e.g. 25,000 m² / Najaf' },
      { key: 'formMessageLabel', label: 'Message field', kind: 'text', max: 80, default: 'Project description & requirements *' },
      { key: 'formMessagePlaceholder', label: 'Message hint', kind: 'text', max: 120, default: 'Site conditions, vision, programme and target timeline…' },
      { key: 'formSend', label: 'Send button', kind: 'text', max: 30, default: 'SEND BRIEF' },
      { key: 'formSending', label: 'Send button while sending', kind: 'text', max: 30, default: 'SENDING…' },
      { key: 'formSentEyebrow', label: 'After sending: small label', kind: 'text', max: 40, default: 'Brief received' },
      { key: 'formSentTitle', label: 'After sending: heading', kind: 'text', max: 80, default: 'Thank you, {name}.', hint: '{name} is replaced by the sender’s name.' },
      { key: 'formSentBody', label: 'After sending: message', kind: 'textarea', max: 300, default: "Your project brief has reached the CVI studio. We'll reply to the email address you gave us." },
      { key: 'formSentAgain', label: 'After sending: link to send another', kind: 'text', max: 40, default: 'Send another brief' },
      { key: 'formErrName', label: 'Problem: missing name', kind: 'text', max: 100, default: 'Please tell us your name.' },
      { key: 'formErrEmail', label: 'Problem: bad email', kind: 'text', max: 100, default: 'Enter a valid email address so we can reply.' },
      { key: 'formErrMessage', label: 'Problem: message too short', kind: 'text', max: 120, default: 'Tell us a little more about the project (at least 10 characters).' },
    ],
  },

  // ----------------------------------------------------------- About page
  {
    tab: 'about',
    title: 'About page: picture',
    fields: [
      { key: 'aboutImage', label: 'Studio picture', kind: 'image', max: 500, default: '/brand/who are we.jpg' },
      { key: 'aboutImageCaption', label: 'Caption on the picture', kind: 'text', max: 100, default: 'Al-Jadriya design studios • Baghdad' },
    ],
  },
  {
    tab: 'about',
    title: 'About page: section headings',
    fields: [
      { key: 'pillarsEyebrow', label: 'Pillars: small label', kind: 'text', max: 60, default: 'Design philosophy' },
      { key: 'pillarsTitle', label: 'Pillars: heading', kind: 'text', max: 80, default: 'What sets us apart' },
      { key: 'aboutServicesEyebrow', label: 'Services: small label', kind: 'text', max: 60, default: 'Integrated capabilities' },
      { key: 'aboutServicesTitle', label: 'Services: heading', kind: 'text', max: 80, default: 'Disciplines & engineering' },
      { key: 'aboutDisciplineLabel', label: 'Word on each card before its number', kind: 'text', max: 30, default: 'DISCIPLINE' },
      { key: 'leadershipEyebrow', label: 'Leadership: small label', kind: 'text', max: 60, default: 'Design directors' },
      { key: 'leadershipTitle', label: 'Leadership: heading', kind: 'text', max: 80, default: 'Studio leadership' },
    ],
  },
  {
    tab: 'about',
    title: 'About page: closing call to action',
    fields: [
      { key: 'aboutCtaTitle', label: 'Heading', kind: 'text', max: 100, default: 'Collaborate with our Baghdad atelier' },
      {
        key: 'aboutCtaBody',
        label: 'Text',
        kind: 'textarea',
        max: 300,
        default: 'We partner with institutional leaders, commercial developers and private clients across Iraq and the Middle East.',
      },
      { key: 'aboutCtaButton', label: 'Button', kind: 'text', max: 40, default: 'Start a conversation' },
    ],
  },

  // ------------------------------------------------- Menu, footer, loader
  {
    tab: 'footer',
    title: 'Menu bar',
    description: 'The links themselves are managed under Menu & navigation.',
    fields: [
      { key: 'brandSubtitle', label: 'Small line under the studio name', kind: 'text', max: 40, default: 'Baghdad Atelier' },
      { key: 'navCtaLabel', label: 'Button on the right', kind: 'text', max: 30, default: 'Start a project' },
      { key: 'menuOpenLabel', label: 'Phone menu button: open', kind: 'text', max: 20, default: 'Menu' },
      { key: 'menuCloseLabel', label: 'Phone menu button: close', kind: 'text', max: 20, default: 'Close' },
      { key: 'menuStudioHeading', label: 'Phone menu: address heading', kind: 'text', max: 40, default: 'Our studio' },
      { key: 'menuContactHeading', label: 'Phone menu: contact heading', kind: 'text', max: 40, default: 'Get in touch' },
      { key: 'menuFollowHeading', label: 'Phone menu: social heading', kind: 'text', max: 40, default: 'Follow us' },
      { key: 'navCtaHref', label: 'Where the button goes', kind: 'text', max: 200, default: '/contact', hint: 'A page of this site (for example /contact) or a full https:// link.' },
    ],
  },
  {
    tab: 'footer',
    title: 'Footer',
    description: 'Address, phone, email and social links come from Studio settings.',
    fields: [
      {
        key: 'footerBlurb',
        label: 'About line',
        kind: 'textarea',
        max: 300,
        default: 'International architectural, computational and structural practice headquartered in Baghdad, Iraq.',
      },
      { key: 'footerMenuTitle', label: 'Heading above the links', kind: 'text', max: 30, default: 'Menu' },
      { key: 'footerStudioTitle', label: 'Heading above the address', kind: 'text', max: 30, default: 'Our studio' },
      { key: 'footerBackToTop', label: '“Back to top” text', kind: 'text', max: 30, default: 'Back to top' },
    ],
  },
  {
    tab: 'footer',
    title: 'Opening screen',
    description: 'The screen shown for a moment when the site opens.',
    fields: [
      { key: 'loaderText', label: 'Letters in the middle', kind: 'text', max: 8, default: 'CVI', hint: 'Up to 8 characters; each letter is shown apart.' },
      { key: 'loaderImage', label: 'Background picture (no longer used)', kind: 'image', max: 500, default: '/brand/loader-map.jpg', hint: 'The opening screen is now a plain cream drafting sheet, so this picture is not shown.' },
    ],
  },
] as const satisfies readonly CopyGroup[];

export type CopyKey = (typeof COPY_GROUPS)[number]['fields'][number]['key'];

/** Defaults for every declared field. */
export const COPY_DEFAULTS = Object.fromEntries(COPY_GROUPS.flatMap((g) => g.fields.map((f) => [f.key, f.default]))) as Record<CopyKey, string>;

/** A big number or word with a caption, shown in the homepage hero. `{projects}` becomes the project count. */
export interface SiteStat {
  value: string;
  label: string;
}

export const DEFAULT_HERO_STATS: SiteStat[] = [
  { value: '500,000+', label: 'm² masterplanned' },
  { value: '{projects}', label: 'projects in the archive' },
  { value: 'Baghdad', label: 'Al-Jadriya atelier' },
];

/** Fills the {projects} / {count} tokens. */
export const fillCount = (text: string, count: number) => text.replace(/\{(?:projects|count)\}/g, String(count));
