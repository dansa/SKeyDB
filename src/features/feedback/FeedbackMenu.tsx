import {useEffect, useId, useRef, useState, type RefObject} from 'react'

import {FaDiscord, FaRegEnvelope, FaXTwitter} from 'react-icons/fa6'

interface FeedbackControlProps {
  locationKey: string
  variant: 'desktop' | 'mobile'
}

export function FeedbackControl({locationKey, variant}: FeedbackControlProps) {
  const menuId = useId().replaceAll(':', '')
  const feedbackMenuId = `site-feedback-menu-${menuId}`
  const [openLocationKey, setOpenLocationKey] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const isOpen = openLocationKey === locationKey

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenLocationKey(null)
        triggerRef.current?.focus()
      }
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Node)) {
        return
      }
      if (menuRef.current?.contains(target) || triggerRef.current?.contains(target)) {
        return
      }
      setOpenLocationKey(null)
    }

    window.addEventListener('keydown', handleKeyDown)
    document.addEventListener('pointerdown', handlePointerDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [isOpen])

  return (
    <>
      <button
        aria-controls={feedbackMenuId}
        aria-expanded={isOpen}
        className={getFeedbackTriggerClassName(variant)}
        onClick={() => {
          setOpenLocationKey((current) => (current === locationKey ? null : locationKey))
        }}
        ref={triggerRef}
        type='button'
      >
        Feedback
      </button>
      {isOpen ? <FeedbackMenu id={feedbackMenuId} menuRef={menuRef} /> : null}
    </>
  )
}

function FeedbackMenu({id, menuRef}: {id: string; menuRef: RefObject<HTMLDivElement | null>}) {
  return (
    <div aria-label='Feedback' className='site-feedback-menu' id={id} ref={menuRef} role='menu'>
      <p className='site-feedback-menu-title'>Feedback</p>
      <p className='site-feedback-menu-copy'>Found bad data, a bug, or have a suggestion?</p>
      <a
        className='site-feedback-menu-item'
        href='mailto:skeydb@dansa.dev?subject=SKeyDB%20feedback'
        role='menuitem'
      >
        <FaRegEnvelope aria-hidden className='site-feedback-menu-item-icon' />
        Email
      </a>
      <a
        className='site-feedback-menu-item'
        href='https://discord.com/users/1280181546527096993'
        rel='noreferrer'
        role='menuitem'
        target='_blank'
      >
        <FaDiscord aria-hidden className='site-feedback-menu-item-icon' />
        Discord: fjantsa
      </a>
      <a
        className='site-feedback-menu-item'
        href='https://x.com/skeydb'
        rel='noreferrer'
        role='menuitem'
        target='_blank'
      >
        <FaXTwitter aria-hidden className='site-feedback-menu-item-icon' />
        X: @skeydb
      </a>
    </div>
  )
}

function getFeedbackTriggerClassName(variant: FeedbackControlProps['variant']): string {
  if (variant === 'mobile') {
    return 'site-mobile-overflow-link site-feedback-mobile-trigger'
  }

  return 'site-feedback-button site-feedback-button--desktop'
}
