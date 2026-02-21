"use client"

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const GITHUB_REPO = 'https://github.com/ctrimm/co2-emission-tracker';

const INDUSTRIES = [
  'Federal Government',
  'State Government',
  'Local Government / Municipal',
  'Education',
  'Healthcare',
  'Finance',
  'Technology',
  'Media / News',
  'Retail / E-commerce',
  'Non-profit',
  'Other',
] as const;

export function SubmitSiteForm() {
  const [domain, setDomain] = useState('');
  const [organization, setOrganization] = useState('');
  const [industry, setIndustry] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    // Strip protocol and path, leaving just the bare domain.
    const cleaned = domain.trim()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/.*$/, '');

    const domainRegex = /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    if (!domainRegex.test(cleaned)) {
      setError('Please enter a valid domain, e.g. example.gov');
      return;
    }

    const title = `Add Site: ${cleaned}`;
    const body = [
      `**Domain:** ${cleaned}`,
      organization.trim() ? `**Organization:** ${organization.trim()}` : null,
      industry ? `**Industry:** ${industry}` : null,
      notes.trim() ? `**Additional notes:** ${notes.trim()}` : null,
    ].filter(Boolean).join('\n');

    const issueUrl = `${GITHUB_REPO}/issues/new`
      + `?title=${encodeURIComponent(title)}`
      + `&body=${encodeURIComponent(body)}`
      + `&labels=add-site`;

    window.open(issueUrl, '_blank', 'noopener,noreferrer');
  }

  const selectClass =
    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm " +
    "ring-offset-background focus-visible:outline-none focus-visible:ring-2 " +
    "focus-visible:ring-ring focus-visible:ring-offset-2";

  const textareaClass =
    "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm " +
    "ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none " +
    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none";

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-lg mx-auto">
      <div className="space-y-1.5">
        <label htmlFor="domain" className="text-sm font-medium">
          Domain <span className="text-red-500">*</span>
        </label>
        <Input
          id="domain"
          type="text"
          placeholder="example.gov"
          value={domain}
          onChange={e => setDomain(e.target.value)}
          required
        />
        <p className="text-xs text-muted-foreground">
          Enter just the domain, without <code>https://</code> or a trailing slash.
        </p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="organization" className="text-sm font-medium">
          Organization / Agency
        </label>
        <Input
          id="organization"
          type="text"
          placeholder="U.S. Department of Example"
          value={organization}
          onChange={e => setOrganization(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="industry" className="text-sm font-medium">Industry</label>
        <select
          id="industry"
          value={industry}
          onChange={e => setIndustry(e.target.value)}
          className={selectClass}
        >
          <option value="">Select an industry…</option>
          {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
        </select>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="notes" className="text-sm font-medium">Additional notes</label>
        <textarea
          id="notes"
          placeholder="Any context about why this site should be tracked…"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
          className={textareaClass}
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button type="submit" className="w-full">
        Open GitHub Issue →
      </Button>
      <p className="text-xs text-muted-foreground text-center">
        Clicking the button opens a pre-filled GitHub issue for review.
        A GitHub account is required to submit.
      </p>
    </form>
  );
}
