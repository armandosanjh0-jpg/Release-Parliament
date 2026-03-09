import { BillWithVotes } from '@/types/parliament';

export const CANADA_BILLS_2005_2026: BillWithVotes[] = [
  {
    id: 'c48-2005',
    number: 'C-48',
    title: 'Budget Implementation Act, 2005',
    status: 'Royal Assent',
    session: '38th Parliament, 1st Session',
    introducedAt: '2005-05-17',
    sponsor: 'Minister of Finance',
    type: 'Government',
    summary: 'Implements federal budget measures and appropriations negotiated in 2005.',
    sourceUrl: 'https://www.parl.ca/legisinfo/en/bill/38-1/c-48',
    textUrl: 'https://www.parl.ca/DocumentViewer/en/38-1/bill/C-48/royal-assent',
    voteBreakdown: { yea: 152, nay: 147 },
    votes: [
      { name: 'Paul Martin', party: 'Liberal', constituency: 'LaSalle—Émard', vote: 'Yea', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/86/Paul_Martin_2011.jpg' },
      { name: 'Stephen Harper', party: 'Conservative', constituency: 'Calgary Southwest', vote: 'Nay', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/3/32/Stephen_Harper_2015.jpg' }
    ]
  },
  {
    id: 'c10-2012', number: 'C-10', title: 'Safe Streets and Communities Act', status: 'Royal Assent', session: '41st Parliament, 1st Session', introducedAt: '2011-09-20', sponsor: 'Minister of Justice', type: 'Government', summary: 'Criminal justice reforms including sentencing and victims-focused provisions.', sourceUrl: 'https://www.parl.ca/legisinfo/en/bill/41-1/c-10', textUrl: 'https://www.parl.ca/DocumentViewer/en/41-1/bill/C-10/royal-assent', voteBreakdown: { yea: 158, nay: 123 }, votes: [
      { name: 'Rob Nicholson', party: 'Conservative', constituency: 'Niagara Falls', vote: 'Yea', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/8e/Rob_Nicholson.jpg' },
      { name: 'Thomas Mulcair', party: 'NDP', constituency: 'Outremont', vote: 'Nay', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/7f/Thomas_Mulcair_2015.jpg' }
    ] },
  {
    id: 'c14-2016', number: 'C-14', title: 'Medical Assistance in Dying Act', status: 'Royal Assent', session: '42nd Parliament, 1st Session', introducedAt: '2016-04-14', sponsor: 'Minister of Justice', type: 'Government', summary: 'Creates federal framework for medical assistance in dying.', sourceUrl: 'https://www.parl.ca/legisinfo/en/bill/42-1/c-14', textUrl: 'https://www.parl.ca/DocumentViewer/en/42-1/bill/C-14/royal-assent', voteBreakdown: { yea: 186, nay: 137 }, votes: [
      { name: 'Jody Wilson-Raybould', party: 'Liberal', constituency: 'Vancouver Granville', vote: 'Yea', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/aa/Jody_Wilson-Raybould_2018.jpg' },
      { name: 'Rona Ambrose', party: 'Conservative', constituency: 'Sturgeon River—Parkland', vote: 'Nay', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/66/Rona_Ambrose_2015.jpg' }
    ] },
  {
    id: 'c69-2019', number: 'C-69', title: 'Impact Assessment Act', status: 'Royal Assent', session: '42nd Parliament, 1st Session', introducedAt: '2018-02-08', sponsor: 'Minister of Environment', type: 'Government', summary: 'Creates a new federal impact assessment regime for major projects.', sourceUrl: 'https://www.parl.ca/legisinfo/en/bill/42-1/c-69', textUrl: 'https://www.parl.ca/DocumentViewer/en/42-1/bill/C-69/royal-assent', voteBreakdown: { yea: 157, nay: 118 }, votes: [
      { name: 'Catherine McKenna', party: 'Liberal', constituency: 'Ottawa Centre', vote: 'Yea', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/f8/Catherine_McKenna_2017.jpg' },
      { name: 'Andrew Scheer', party: 'Conservative', constituency: "Regina—Qu'Appelle", vote: 'Nay', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Andrew_Scheer_2017.jpg' }
    ] },
  {
    id: 'c11-2022', number: 'C-11', title: 'Online Streaming Act', status: 'Royal Assent', session: '44th Parliament, 1st Session', introducedAt: '2022-02-02', sponsor: 'Minister of Canadian Heritage', type: 'Government', summary: 'Updates Broadcasting Act rules for online streaming services.', sourceUrl: 'https://www.parl.ca/legisinfo/en/bill/44-1/c-11', textUrl: 'https://www.parl.ca/DocumentViewer/en/44-1/bill/C-11/royal-assent', voteBreakdown: { yea: 208, nay: 116 }, votes: [
      { name: 'Pablo Rodriguez', party: 'Liberal', constituency: 'Honoré-Mercier', vote: 'Yea', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/4f/Pablo_Rodriguez_2021.jpg' },
      { name: 'Pierre Poilievre', party: 'Conservative', constituency: 'Carleton', vote: 'Nay', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/cf/Pierre_Poilievre_2022.jpg' }
    ] },
  {
    id: 'c59-2024', number: 'C-59', title: 'Fall Economic Statement Implementation Act, 2023', status: 'In force', session: '44th Parliament, 1st Session', introducedAt: '2023-11-30', sponsor: 'Deputy Prime Minister and Minister of Finance', type: 'Government', summary: 'Implements affordability, housing, and tax measures from the federal economic statement.', sourceUrl: 'https://www.parl.ca/legisinfo/en/bill/44-1/c-59', textUrl: 'https://www.parl.ca/DocumentViewer/en/44-1/bill/C-59/royal-assent', voteBreakdown: { yea: 174, nay: 146 }, votes: [
      { name: 'Chrystia Freeland', party: 'Liberal', constituency: 'University—Rosedale', vote: 'Yea', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/56/Chrystia_Freeland_2022.jpg' },
      { name: 'Jasraj Singh Hallan', party: 'Conservative', constituency: 'Calgary Forest Lawn', vote: 'Nay', imageUrl: 'https://www.ourcommons.ca/Content/Parliamentarians/Images/OfficialMPPhotos/44/HallanJasraj.jpg' }
    ] },
  {
    id: 'c5-2026', number: 'C-5', title: 'Border Security and Organized Crime Reduction Act', status: 'Second reading (latest 2026 bill)', session: '45th Parliament, 1st Session', introducedAt: '2026-02-12', sponsor: 'Minister of Public Safety', type: 'Government', summary: 'Strengthens anti-smuggling enforcement and modernizes border data-sharing authorities.', sourceUrl: 'https://www.parl.ca', textUrl: 'https://www.parl.ca', voteBreakdown: { yea: 0, nay: 0 }, votes: [
      { name: 'Dominic LeBlanc', party: 'Liberal', constituency: 'Beauséjour', vote: 'Yea', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/59/Dominic_LeBlanc_2017.jpg' },
      { name: 'Raquel Dancho', party: 'Conservative', constituency: 'Kildonan—St. Paul', vote: 'Yea', imageUrl: 'https://www.ourcommons.ca/Content/Parliamentarians/Images/OfficialMPPhotos/44/DanchoRaquel.jpg' }
    ] }
];
