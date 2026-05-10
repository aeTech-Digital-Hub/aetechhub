import { ContactForm } from '@/components/forms/ContactForm';

export const metadata = { title: 'Contact' };

export default function ContactPage() {
  return (
    <section className="container-px pt-20 lg:pt-28 pb-32">
      <div className="grid lg:grid-cols-12 gap-16 max-w-7xl">
        <div className="lg:col-span-5">
          <div className="flex items-center gap-3 mb-10">
            <span className="gold-rule" />
            <span className="eyebrow text-purple-700">— Contact</span>
          </div>
          <h1 className="h-display text-6xl lg:text-7xl leading-[0.95] mb-8">
            Say<br /><span className="italic font-light text-purple-700">hello.</span>
          </h1>

          <div className="space-y-6 mt-10">
            <ContactRow label="Email"  value="ephraim@aetechdigitalhub.com" href="mailto:ephraim@aetechdigitalhub.com" />
            <ContactRow label="Phone"  value="+233 554 448 061"          href="tel:+233554448061" />
            <ContactRow label="Studio" value="Spintex Flower Port, Accra · Ghana" />
            <ContactRow label="Hours"  value="Mon–Fri · 09:00–17:00 GMT" />
          </div>
        </div>

        <div className="lg:col-span-7">
          <ContactForm />
        </div>
      </div>
    </section>
  );
}

function ContactRow({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <div className="border-b border-rule pb-5">
      <p className="font-mono text-[11px] tracking-wider uppercase text-ink/50 mb-1">{label}</p>
      {href ? <a href={href} className="link-underline font-display text-2xl">{value}</a> : <p className="font-display text-2xl">{value}</p>}
    </div>
  );
}
