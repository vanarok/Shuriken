export default defineBackground(() => {
  console.log('Hello background!', { id: browser.runtime.id });

  // Allows users to open the side panel by clicking on the action toolbar icon
  // @ts-expect-error: sidePanel is not typed
  browser.sidePanel
      .setPanelBehavior({ openPanelOnActionClick: true })
      .catch((error: unknown) => console.error(error));
});
