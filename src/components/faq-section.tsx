import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion"

const faqData = [
	{
	  id: "item-1",
	  question: "What percentage of carbon emissions is due to data center usage?",
	  answer: "Data centers contribute to approximately 15% of the carbon emissions attributed to the electricity required to power servers and the cooling systems that keep them operational.",
	  source: "https://www.datacenterdynamics.com/en/analysis/how-much-co2-do-data-centers-produce/"
	},
	{
	  id: "item-2",
	  question: "How significant is the impact of network transfer on carbon emissions?",
	  answer: "Network transfer, including core and mobile networks, on-premise wifi, and wired routers, accounts for 14% of carbon emissions from the electricity used to power these networks.",
	  source: "https://www.iea.org/reports/digitalisation-and-energy"
	},
	{
	  id: "item-3",
	  question: "What proportion of carbon emissions comes from end-user devices?",
	  answer: "End-user devices such as smartphones, tablets, laptops, desktops, and gaming consoles are responsible for 52% of carbon emissions from the electricity they consume.",
	  source: "https://www.sciencedirect.com/science/article/pii/S2214629618301051"
	},
	{
	  id: "item-4",
	  question: "What is the carbon footprint of producing IT hardware and software?",
	  answer: "The production of IT hardware, software, and associated infrastructure contributes to 19% of carbon emissions from the electricity used in their production processes.",
	  source: "https://www.nature.com/articles/d41586-018-06610-y"
	},
	{
	  id: "item-5",
	  question: "How can data centers reduce their carbon footprint?",
	  answer: "Data centers can reduce their carbon footprint by using renewable energy sources, improving energy efficiency through advanced cooling systems, and employing server virtualization to maximize hardware usage.",
	  source: "https://www.epa.gov/greenpower/data-center-efficiency-and-green-power"
	},
	{
	  id: "item-6",
	  question: "Can switching to green hosting make a difference in carbon emissions?",
	  answer: "Yes, green hosting, which uses renewable energy sources to power servers, can significantly reduce the carbon footprint of websites and online services.",
	  source: "https://www.thegreenwebfoundation.org/"
	},
	{
	  id: "item-7",
	  question: "Are there best practices for individuals to reduce the carbon footprint of their device usage?",
	  answer: "Individuals can reduce the carbon footprint of their device usage by adjusting energy-saving settings, reducing screen brightness, disconnecting chargers when not in use, and recycling old devices responsibly.",
	  source: "https://www.energy.gov/energysaver/articles/how-save-energy-and-reduce-electronic-waste-while-working-home"
	}
  ];

export default function FaqSection() {
	return (
		<Accordion type="single" collapsible className="w-full">
			{faqData.map((faqItem) => (
				<AccordionItem key={faqItem.id} value={faqItem.id}>
					<AccordionTrigger>{faqItem.question}</AccordionTrigger>
					<AccordionContent>{faqItem.answer}</AccordionContent>
					<AccordionContent>
						<a href={faqItem.source} target='_blank' rel='noreferrer' className='underline underline-offset-4 flex'>
							Source
							<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-arrow-up-right-from-square mt-1 ml-1"><path d="M21 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6"/><path d="m21 3-9 9"/><path d="M15 3h6v6"/></svg>
						</a>
					</AccordionContent>
				</AccordionItem>
			))}
		</Accordion>
	)
}
