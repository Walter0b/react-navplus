import React, { createRef, useState } from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createNavPlus } from '../../src/core/createNavPlus';
import { createFakeRouter } from '../helpers/fakeRouter';

afterEach(() => {
  cleanup();
  jest.useRealTimers();
  jest.restoreAllMocks();
});

const setup = (initialPath = '/', extras = {}) => {
  const router = createFakeRouter(initialPath, extras);
  return { router, ...createNavPlus(router.adapter) };
};

const link = () => screen.getByRole('link');

describe('interaction regressions', () => {
  beforeEach(() => jest.useFakeTimers());

  test.each(['leave', 'unmount'])('a click commits a pending hover before %s', (action) => {
    const { NavPlus, router } = setup();
    const { unmount } = render(<NavPlus to="/a" triggerEvent="hover" navigationDelay={300}>A</NavPlus>);
    fireEvent.mouseEnter(link());
    act(() => void jest.advanceTimersByTime(100));
    fireEvent.click(link());
    if (action === 'leave') fireEvent.mouseLeave(link());
    else unmount();
    act(() => void jest.advanceTimersByTime(1000));
    expect(router.navigations.map((navigation) => navigation.to)).toEqual(['/a']);
  });

  test.each([
    { disabled: true },
    { to: '/b' },
    { isExternal: true },
    { triggerEvent: 'click' as const },
  ])('cancels pending hover work when props change to %j', (changes) => {
    const preload = jest.fn();
    const { NavPlus, router } = setup('/', { usePrefetch: () => preload });
    const props = { to: '/a', triggerEvent: 'hover' as const, navigationDelay: 300, prefetch: true };
    const { rerender } = render(<NavPlus {...props}>A</NavPlus>);
    fireEvent.mouseEnter(link());
    rerender(<NavPlus {...props} {...changes}>A</NavPlus>);
    act(() => void jest.advanceTimersByTime(1000));
    expect(router.navigations).toHaveLength(0);
    expect(preload).not.toHaveBeenCalled();
  });

  test('turning prefetch off cancels an already scheduled request', () => {
    const handler = jest.fn();
    const { NavPlus } = setup();
    const { rerender } = render(<NavPlus to="/a" prefetch={{ handler }}>A</NavPlus>);
    fireEvent.focus(link());
    rerender(<NavPlus to="/a" prefetch={{ handler, enabled: false }}>A</NavPlus>);
    act(() => void jest.advanceTimersByTime(1000));
    expect(handler).not.toHaveBeenCalled();
  });

  test.each(['throw', 'reject'])('prefetch can retry after a handler fails with %s', async (failure) => {
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const handler = jest.fn().mockImplementationOnce(() => {
      if (failure === 'throw') throw new Error('offline');
      return Promise.reject(new Error('offline'));
    });
    const { NavPlus } = setup();
    render(<NavPlus to="/a" prefetch={{ handler }}>A</NavPlus>);
    fireEvent.mouseEnter(link());
    await act(async () => { jest.advanceTimersByTime(200); });
    fireEvent.mouseLeave(link());
    fireEvent.mouseEnter(link());
    await act(async () => { jest.advanceTimersByTime(200); });
    expect(handler).toHaveBeenCalledTimes(2);
  });

  test('prefetch follows the resolved destination when a relative link changes context', () => {
    let base = '/first';
    const handler = jest.fn();
    const { NavPlus } = setup('/', {
      useResolve: () => ({ href: `${base}/child`, pathname: `${base}/child` }),
    });
    const { rerender } = render(<NavPlus to="child" prefetch={{ handler }}>A</NavPlus>);
    fireEvent.mouseEnter(link());
    act(() => void jest.advanceTimersByTime(200));
    fireEvent.mouseLeave(link());
    base = '/second';
    rerender(<NavPlus to="child" prefetch={{ handler }}>A</NavPlus>);
    fireEvent.mouseEnter(link());
    act(() => void jest.advanceTimersByTime(200));
    expect(handler).toHaveBeenCalledTimes(2);
  });

  test.each([{ target: '_blank' }, { download: true }, { download: '' }])(
    'does not hover-navigate browser-managed links: %j', (props) => {
      const { NavPlus, router } = setup();
      render(<NavPlus to="/a" triggerEvent="hover" {...props}>A</NavPlus>);
      fireEvent.mouseEnter(link());
      expect(router.navigations).toHaveLength(0);
    }
  );

  test('download=false is an ordinary routed link', () => {
    const { NavPlus, router } = setup();
    render(<NavPlus to="/a" download={false}>A</NavPlus>);
    expect(link().hasAttribute('download')).toBe(false);
    expect(fireEvent.click(link())).toBe(false);
    expect(router.navigations).toHaveLength(1);
  });

  test('forwards data-testid and allows the testId alias to override it', () => {
    const { NavPlus } = setup();
    const { rerender } = render(<NavPlus to="/a" data-testid="native">A</NavPlus>);
    expect(screen.getByTestId('native')).toBe(link());
    rerender(<NavPlus to="/a" data-testid="native" testId="alias">A</NavPlus>);
    expect(screen.getByTestId('alias')).toBe(link());
  });

  test('preventDefault in enter and focus handlers cancels automatic work', () => {
    const handler = jest.fn();
    const { NavPlus, router } = setup();
    render(
      <NavPlus to="/a" triggerEvent="hover" prefetch={{ handler }}
        onMouseEnter={(event) => event.preventDefault()}
        onFocus={(event) => event.preventDefault()}>A</NavPlus>
    );
    fireEvent.mouseEnter(link());
    fireEvent.focus(link());
    act(() => void jest.advanceTimersByTime(1000));
    expect(router.navigations).toHaveLength(0);
    expect(handler).not.toHaveBeenCalled();
  });

  test.each(['focus', 'hover'])('keeps prefetch pending while %s remains', (remaining) => {
    const handler = jest.fn();
    const { NavPlus } = setup();
    render(<NavPlus to="/a" prefetch={{ handler }}>A</NavPlus>);
    fireEvent.mouseEnter(link());
    act(() => void jest.advanceTimersByTime(100));
    fireEvent.focus(link());
    if (remaining === 'focus') fireEvent.mouseLeave(link());
    else fireEvent.blur(link());
    act(() => void jest.advanceTimersByTime(100));
    expect(handler).toHaveBeenCalledTimes(1);
  });
});

describe('rendering', () => {
  test('renders an anchor with the href and children', () => {
    const { NavPlus } = setup();
    render(<NavPlus to="/about">About</NavPlus>);
    expect(link().tagName).toBe('A');
    expect(link().getAttribute('href')).toBe('/about');
    expect(link().textContent).toBe('About');
  });

  test('marks the active link with aria-current, data-active and the active class', () => {
    const { NavPlus } = setup('/about/team');
    render(
      <>
        <NavPlus to="/about">About</NavPlus>
        <NavPlus to="/blog">Blog</NavPlus>
      </>
    );
    const [about, blog] = screen.getAllByRole('link');
    expect(about?.getAttribute('aria-current')).toBe('page');
    expect(about?.getAttribute('data-active')).toBe('true');
    expect(about?.className).toBe('active navplus-link');
    expect(blog?.getAttribute('aria-current')).toBeNull();
    expect(blog?.getAttribute('data-active')).toBeNull();
    expect(blog?.className).toBe('navplus-link');
  });

  test('combines className with the state class and lets aria-current be overridden', () => {
    const { NavPlus } = setup('/a');
    render(
      <NavPlus to="/a" className="base" activeClassName="on" aria-current="location">
        A
      </NavPlus>
    );
    expect(link().className).toBe('base on navplus-link');
    expect(link().getAttribute('aria-current')).toBe('location');
  });

  test('uses inActiveClassName and inactiveStyle when inactive, merged over style', () => {
    const { NavPlus } = setup('/other');
    render(
      <NavPlus
        to="/a"
        inActiveClassName="off"
        style={{ color: 'red', margin: 1 }}
        inactiveStyle={{ color: 'blue' }}
        activeStyle={{ color: 'green' }}
      >
        A
      </NavPlus>
    );
    expect(link().className).toBe('off navplus-link');
    expect(link().style.color).toBe('blue');
    expect(link().style.margin).toBe('1px');
  });

  test('applies activeStyle when active', () => {
    const { NavPlus } = setup('/a');
    render(
      <NavPlus to="/a" activeStyle={{ color: 'green' }}>
        A
      </NavPlus>
    );
    expect(link().style.color).toBe('green');
  });

  test('passes the active state to a children function', () => {
    const { NavPlus } = setup('/a');
    render(
      <>
        <NavPlus to="/a">{(active) => (active ? 'on' : 'off')}</NavPlus>
        <NavPlus to="/b">{(active) => (active ? 'on' : 'off')}</NavPlus>
      </>
    );
    expect(screen.getAllByRole('link').map((el) => el.textContent)).toEqual(['on', 'off']);
  });

  test('forwards extra props and the ref to the element, but not its own props', () => {
    const { NavPlus } = setup();
    const ref = createRef<HTMLAnchorElement>();
    const error = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    render(
      <NavPlus
        to="/a"
        ref={ref}
        id="x"
        aria-label="Go"
        testId="t"
        isActiveFunc={() => true}
        matchMode="exact"
        navigationDelay={0}
      >
        A
      </NavPlus>
    );
    expect(ref.current).toBe(link());
    expect(link().id).toBe('x');
    expect(link().getAttribute('aria-label')).toBe('Go');
    expect(link().getAttribute('data-testid')).toBe('t');
    expect(link().hasAttribute('isactivefunc')).toBe(false);
    expect(error).not.toHaveBeenCalled();
  });

  test('renders a custom element or component through `as`, with href', () => {
    const { NavPlus } = setup();
    const Fancy = React.forwardRef<HTMLAnchorElement, React.ComponentProps<'a'>>(function Fancy(
      props,
      ref
    ) {
      return (
        <a ref={ref} data-fancy {...props}>
          {props.children}
        </a>
      );
    });
    render(
      <NavPlus to="/a" as={Fancy}>
        A
      </NavPlus>
    );
    expect(link().getAttribute('data-fancy')).toBe('true');
    expect(link().getAttribute('href')).toBe('/a');
  });

  test('survives `to` changing between empty and set', () => {
    const { NavPlus } = setup();
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { rerender } = render(<NavPlus to="">A</NavPlus>);
    expect(() => rerender(<NavPlus to="/a">A</NavPlus>)).not.toThrow();
    expect(() => rerender(<NavPlus to={undefined as unknown as string}>A</NavPlus>)).not.toThrow();
    expect(() => rerender(<NavPlus to="/b">A</NavPlus>)).not.toThrow();
    warn.mockRestore();
  });
});

describe('active matching options', () => {
  test('matchMode, matchPattern, customActiveUrl and caseSensitive are honoured', () => {
    const { NavPlus } = setup('/Products/42');
    render(
      <>
        <NavPlus to="/products" matchMode="exact">exact</NavPlus>
        <NavPlus to="/x" matchMode="pattern" matchPattern={/^\/products\/\d+$/i}>pattern</NavPlus>
        <NavPlus to="/x" customActiveUrl="/products">custom</NavPlus>
        <NavPlus to="/products" caseSensitive>case</NavPlus>
      </>
    );
    expect(screen.getAllByRole('link').map((el) => el.getAttribute('aria-current'))).toEqual([
      null,
      'page',
      'page',
      null,
    ]);
  });

  test('isActiveFunc replaces the built-in matching', () => {
    const { NavPlus } = setup('/a');
    const isActiveFunc = jest.fn(() => true);
    render(
      <NavPlus to="/zzz" isActiveFunc={isActiveFunc}>
        A
      </NavPlus>
    );
    expect(link().getAttribute('aria-current')).toBe('page');
    expect(isActiveFunc).toHaveBeenCalledWith('/a', '/zzz', { pathname: '/a', search: '', hash: '' });
  });

  test('useIsActive gives the same answer as the component', () => {
    const { useIsActive } = setup('/docs/intro');
    const Probe = ({ to, mode }: { to: string; mode?: 'exact' }) => (
      <span data-testid={to}>{String(useIsActive(to, mode ? { matchMode: mode } : {}))}</span>
    );
    render(
      <>
        <Probe to="/docs" />
        <Probe to="/docs" mode="exact" />
      </>
    );
    expect(screen.getAllByTestId('/docs').map((el) => el.textContent)).toEqual(['true', 'false']);
  });

  test('a link to an absolute URL is never active', () => {
    const { NavPlus } = setup('/');
    render(<NavPlus to="https://example.com/">Home</NavPlus>);
    expect(link().getAttribute('aria-current')).toBeNull();
  });
});

describe('clicking', () => {
  test('navigates and stops the browser from following the link', () => {
    const { NavPlus, router } = setup();
    render(<NavPlus to="/about">About</NavPlus>);
    const notPrevented = fireEvent.click(link());
    expect(notPrevented).toBe(false);
    expect(router.navigations).toEqual([{ to: '/about', options: {} }]);
  });

  test('passes replace, state and navigateOptions to the router', () => {
    const { NavPlus, router } = setup();
    render(
      <NavPlus to="/a" replace state={{ from: 'x' }} navigateOptions={{ extra: 1 } as never}>
        A
      </NavPlus>
    );
    fireEvent.click(link());
    expect(router.navigations[0]?.options).toEqual({ extra: 1, replace: true, state: { from: 'x' } });
  });

  test.each([
    ['ctrl', { ctrlKey: true }],
    ['meta', { metaKey: true }],
    ['shift', { shiftKey: true }],
    ['alt', { altKey: true }],
    ['middle button', { button: 1 }],
  ])('leaves a %s click to the browser', (_name, init) => {
    const { NavPlus, router } = setup();
    render(<NavPlus to="/a">A</NavPlus>);
    expect(fireEvent.click(link(), init)).toBe(true);
    expect(router.navigations).toHaveLength(0);
  });

  test('leaves target and download links to the browser', () => {
    const { NavPlus, router } = setup();
    render(
      <>
        <NavPlus to="/a" target="_blank">blank</NavPlus>
        <NavPlus to="/b" download>download</NavPlus>
        <NavPlus to="/c" target="_self">self</NavPlus>
      </>
    );
    const [blank, download, self] = screen.getAllByRole('link');
    expect(fireEvent.click(blank!)).toBe(true);
    expect(fireEvent.click(download!)).toBe(true);
    expect(fireEvent.click(self!)).toBe(false);
    expect(router.navigations.map((n) => n.to)).toEqual(['/c']);
  });

  test('calls onClick first and respects preventDefault from it', () => {
    const { NavPlus, router } = setup();
    const onClick = jest.fn((event: React.MouseEvent) => event.preventDefault());
    render(
      <NavPlus to="/a" onClick={onClick}>
        A
      </NavPlus>
    );
    fireEvent.click(link());
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(router.navigations).toHaveLength(0);
  });
});

describe('disabled', () => {
  test('has no href, is announced as disabled and cannot be activated', () => {
    const { NavPlus, router } = setup();
    const onClick = jest.fn();
    render(
      <NavPlus to="/a" disabled onClick={onClick}>
        A
      </NavPlus>
    );
    expect(link().hasAttribute('href')).toBe(false);
    expect(link().getAttribute('aria-disabled')).toBe('true');
    expect(link().getAttribute('tabindex')).toBe('-1');
    expect(fireEvent.click(link())).toBe(false);
    expect(onClick).not.toHaveBeenCalled();
    expect(router.navigations).toHaveLength(0);
  });

  test('does not add aria-disabled to enabled links', () => {
    const { NavPlus } = setup();
    render(<NavPlus to="/a">A</NavPlus>);
    expect(link().hasAttribute('aria-disabled')).toBe(false);
  });
});

describe('external links', () => {
  test('isExternal opens a new tab safely and is never routed', () => {
    const { NavPlus, router } = setup();
    render(
      <NavPlus to="https://example.com" isExternal>
        Out
      </NavPlus>
    );
    expect(link().getAttribute('href')).toBe('https://example.com');
    expect(link().getAttribute('target')).toBe('_blank');
    expect(link().getAttribute('rel')).toBe('noopener noreferrer');
    expect(fireEvent.click(link())).toBe(true);
    expect(router.navigations).toHaveLength(0);
  });

  test('absolute URLs are left to the browser without forcing a new tab', () => {
    const { NavPlus, router } = setup();
    render(<NavPlus to="mailto:a@b.c">Mail</NavPlus>);
    expect(link().getAttribute('href')).toBe('mailto:a@b.c');
    expect(link().hasAttribute('target')).toBe(false);
    expect(fireEvent.click(link())).toBe(true);
    expect(router.navigations).toHaveLength(0);
  });

  test('explicit target and rel win over the isExternal defaults', () => {
    const { NavPlus } = setup();
    render(
      <NavPlus to="https://example.com" isExternal target="_top" rel="nofollow">
        Out
      </NavPlus>
    );
    expect(link().getAttribute('target')).toBe('_top');
    expect(link().getAttribute('rel')).toBe('nofollow');
  });
});

describe('navigationDelay', () => {
  beforeEach(() => jest.useFakeTimers());

  test('waits before navigating', () => {
    const { NavPlus, router } = setup();
    render(
      <NavPlus to="/a" navigationDelay={300}>
        A
      </NavPlus>
    );
    fireEvent.click(link());
    expect(router.navigations).toHaveLength(0);
    act(() => void jest.advanceTimersByTime(299));
    expect(router.navigations).toHaveLength(0);
    act(() => void jest.advanceTimersByTime(1));
    expect(router.navigations).toHaveLength(1);
  });

  test('clicking again restarts the wait instead of navigating twice', () => {
    const { NavPlus, router } = setup();
    render(
      <NavPlus to="/a" navigationDelay={300}>
        A
      </NavPlus>
    );
    fireEvent.click(link());
    act(() => void jest.advanceTimersByTime(200));
    fireEvent.click(link());
    act(() => void jest.advanceTimersByTime(1000));
    expect(router.navigations).toHaveLength(1);
  });

  test('a click still navigates if the link unmounts during the wait', () => {
    const { NavPlus, router } = setup();
    const Menu = () => {
      const [open, setOpen] = useState(true);
      return open ? (
        <NavPlus to="/a" navigationDelay={100} onClick={() => setOpen(false)}>
          A
        </NavPlus>
      ) : null;
    };
    render(<Menu />);
    fireEvent.click(link());
    expect(screen.queryByRole('link')).toBeNull();
    act(() => void jest.advanceTimersByTime(100));
    expect(router.navigations).toHaveLength(1);
  });
});

describe('triggerEvent="hover"', () => {
  beforeEach(() => jest.useFakeTimers());

  test('navigates when the pointer enters', () => {
    const { NavPlus, router } = setup();
    render(
      <NavPlus to="/a" triggerEvent="hover">
        A
      </NavPlus>
    );
    fireEvent.mouseEnter(link());
    expect(router.navigations.map((n) => n.to)).toEqual(['/a']);
  });

  test('a click after the hover does not navigate a second time', () => {
    const { NavPlus, router } = setup();
    render(
      <NavPlus to="/a" triggerEvent="hover">
        A
      </NavPlus>
    );
    fireEvent.mouseEnter(link());
    expect(fireEvent.click(link())).toBe(false); // still no full page load
    expect(router.navigations).toHaveLength(1);
  });

  test('a click without a hover (touch) still navigates', () => {
    const { NavPlus, router } = setup();
    render(
      <NavPlus to="/a" triggerEvent="hover">
        A
      </NavPlus>
    );
    fireEvent.click(link());
    expect(router.navigations).toHaveLength(1);
  });

  test('leaving before navigationDelay elapses cancels the navigation', () => {
    const { NavPlus, router } = setup();
    render(
      <NavPlus to="/a" triggerEvent="hover" navigationDelay={300}>
        A
      </NavPlus>
    );
    fireEvent.mouseEnter(link());
    act(() => void jest.advanceTimersByTime(200));
    fireEvent.mouseLeave(link());
    act(() => void jest.advanceTimersByTime(1000));
    expect(router.navigations).toHaveLength(0);
  });

  test('staying for navigationDelay navigates', () => {
    const { NavPlus, router } = setup();
    render(
      <NavPlus to="/a" triggerEvent="hover" navigationDelay={300}>
        A
      </NavPlus>
    );
    fireEvent.mouseEnter(link());
    act(() => void jest.advanceTimersByTime(300));
    expect(router.navigations).toHaveLength(1);
  });

  test('leaving does not cancel a navigation started by a click', () => {
    const { NavPlus, router } = setup();
    render(
      <NavPlus to="/a" triggerEvent="hover" navigationDelay={300}>
        A
      </NavPlus>
    );
    fireEvent.click(link());
    fireEvent.mouseLeave(link());
    act(() => void jest.advanceTimersByTime(300));
    expect(router.navigations).toHaveLength(1);
  });

  test('does nothing when already at the target', () => {
    const { NavPlus, router } = setup('/a');
    render(
      <NavPlus to="/a" triggerEvent="hover">
        A
      </NavPlus>
    );
    fireEvent.mouseEnter(link());
    expect(router.navigations).toHaveLength(0);
  });

  test('does not hover-navigate a disabled link', () => {
    const { NavPlus, router } = setup();
    render(
      <NavPlus to="/a" triggerEvent="hover" disabled>
        A
      </NavPlus>
    );
    fireEvent.mouseEnter(link());
    expect(router.navigations).toHaveLength(0);
  });

  test('still calls the onMouseEnter and onMouseLeave props', () => {
    const { NavPlus } = setup();
    const onMouseEnter = jest.fn();
    const onMouseLeave = jest.fn();
    render(
      <NavPlus to="/a" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
        A
      </NavPlus>
    );
    fireEvent.mouseEnter(link());
    fireEvent.mouseLeave(link());
    expect(onMouseEnter).toHaveBeenCalledTimes(1);
    expect(onMouseLeave).toHaveBeenCalledTimes(1);
  });
});

describe('prefetch', () => {
  beforeEach(() => jest.useFakeTimers());

  test('uses the adapter after the default delay, once', () => {
    const preload = jest.fn();
    const { NavPlus } = setup('/', { usePrefetch: () => preload });
    render(
      <NavPlus to="/a" prefetch>
        A
      </NavPlus>
    );
    fireEvent.mouseEnter(link());
    act(() => void jest.advanceTimersByTime(199));
    expect(preload).not.toHaveBeenCalled();
    act(() => void jest.advanceTimersByTime(1));
    expect(preload).toHaveBeenCalledWith('/a');

    fireEvent.mouseLeave(link());
    fireEvent.mouseEnter(link());
    act(() => void jest.advanceTimersByTime(1000));
    expect(preload).toHaveBeenCalledTimes(1);
  });

  test('is cancelled by leaving before the delay', () => {
    const preload = jest.fn();
    const { NavPlus } = setup('/', { usePrefetch: () => preload });
    render(
      <NavPlus to="/a" prefetch>
        A
      </NavPlus>
    );
    fireEvent.mouseEnter(link());
    act(() => void jest.advanceTimersByTime(100));
    fireEvent.mouseLeave(link());
    act(() => void jest.advanceTimersByTime(1000));
    expect(preload).not.toHaveBeenCalled();
  });

  test('also runs on keyboard focus and is cancelled by blur', () => {
    const preload = jest.fn();
    const { NavPlus } = setup('/', { usePrefetch: () => preload });
    render(
      <>
        <NavPlus to="/a" prefetch>A</NavPlus>
        <NavPlus to="/b" prefetch>B</NavPlus>
      </>
    );
    const [a, b] = screen.getAllByRole('link');
    fireEvent.focus(a!);
    act(() => void jest.advanceTimersByTime(200));
    fireEvent.focus(b!);
    fireEvent.blur(b!);
    act(() => void jest.advanceTimersByTime(1000));
    expect(preload.mock.calls).toEqual([['/a']]);
  });

  test('honours a custom delay and a custom handler over the adapter', () => {
    const adapterPreload = jest.fn();
    const handler = jest.fn();
    const { NavPlus } = setup('/', { usePrefetch: () => adapterPreload });
    render(
      <NavPlus to="/a" prefetch={{ delay: 50, handler }}>
        A
      </NavPlus>
    );
    fireEvent.mouseEnter(link());
    act(() => void jest.advanceTimersByTime(50));
    expect(handler).toHaveBeenCalledWith('/a');
    expect(adapterPreload).not.toHaveBeenCalled();
  });

  test('a zero delay is respected', () => {
    const handler = jest.fn();
    const { NavPlus } = setup();
    render(
      <NavPlus to="/a" prefetch={{ delay: 0, handler }}>
        A
      </NavPlus>
    );
    fireEvent.mouseEnter(link());
    act(() => void jest.advanceTimersByTime(0));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  test.each([
    ['omitted', undefined],
    ['false', false],
    ['enabled: false', { enabled: false }],
  ])('does nothing when prefetch is %s', (_name, prefetch) => {
    const preload = jest.fn();
    const { NavPlus } = setup('/', { usePrefetch: () => preload });
    render(
      <NavPlus to="/a" prefetch={prefetch}>
        A
      </NavPlus>
    );
    fireEvent.mouseEnter(link());
    act(() => void jest.advanceTimersByTime(1000));
    expect(preload).not.toHaveBeenCalled();
  });

  test('does not prefetch disabled or external links', () => {
    const preload = jest.fn();
    const { NavPlus } = setup('/', { usePrefetch: () => preload });
    render(
      <>
        <NavPlus to="/a" prefetch disabled>A</NavPlus>
        <NavPlus to="https://example.com" prefetch>B</NavPlus>
      </>
    );
    screen.getAllByRole('link').forEach((el) => fireEvent.mouseEnter(el));
    act(() => void jest.advanceTimersByTime(1000));
    expect(preload).not.toHaveBeenCalled();
  });

  test('tells the developer once when the adapter has no prefetch and no handler is given', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { NavPlus } = setup();
    render(
      <NavPlus to="/a" prefetch>
        A
      </NavPlus>
    );
    fireEvent.mouseEnter(link());
    fireEvent.mouseLeave(link());
    fireEvent.mouseEnter(link());
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toMatch(/adapter has no built-in prefetch/);
  });

  test('cancels a pending prefetch on unmount', () => {
    const preload = jest.fn();
    const { NavPlus } = setup('/', { usePrefetch: () => preload });
    const { unmount } = render(
      <NavPlus to="/a" prefetch>
        A
      </NavPlus>
    );
    fireEvent.mouseEnter(link());
    unmount();
    act(() => void jest.advanceTimersByTime(1000));
    expect(preload).not.toHaveBeenCalled();
  });
});

describe('adapter resolution', () => {
  test('uses the adapter href for the anchor and its pathname for matching', () => {
    const { NavPlus } = setup('/settings', {
      useResolve: (to: string) => ({ href: `/app${to}`, pathname: to }),
    });
    render(<NavPlus to="/settings">S</NavPlus>);
    expect(link().getAttribute('href')).toBe('/app/settings');
    expect(link().getAttribute('aria-current')).toBe('page');
  });

  test('navigates with `to` as written, leaving resolution to the router', () => {
    const { NavPlus, router } = setup('/', {
      useResolve: (to: string) => ({ href: `/app${to}`, pathname: to }),
    });
    render(<NavPlus to="/settings">S</NavPlus>);
    fireEvent.click(link());
    expect(router.navigations[0]?.to).toBe('/settings');
  });

  test('does not ask the adapter to resolve an absolute URL', () => {
    const useResolve = jest.fn((to: string) => ({ href: to, pathname: to }));
    const { NavPlus } = setup('/', { useResolve });
    render(<NavPlus to="https://example.com/x">X</NavPlus>);
    expect(useResolve).toHaveBeenCalledWith('', undefined);
    expect(link().getAttribute('href')).toBe('https://example.com/x');
  });
});
