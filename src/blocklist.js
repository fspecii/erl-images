/**
 * Copyright / licensing risk blacklist.
 *
 * Any Bing image URL whose host or path matches an entry here is dropped before
 * download, so a licensed, watermarked, or brand-poisoned image never lands on
 * a commercial client site.
 *
 * Matching rules (see `isBlocked`):
 *   1. ALLOW override — a small set of genuinely-free CC0 hosts always pass,
 *      even if a substring below would otherwise match.
 *   2. Domains + watermark patterns are matched as case-insensitive SUBSTRINGS
 *      against the full URL, so a bare domain ("alamy.com") also catches its
 *      CDN subdomains, and a hotlinked "shutterstock_123.jpg" on a third-party
 *      blog is caught even though the host itself looked clean.
 *
 * Philosophy: false positives (skipping a truly-free image) cost far less than
 * a copyright claim, so this list is deliberately aggressive. Categories are
 * kept separate for auditability and flattened + deduped at load.
 *
 * Compiled 2026-07-23 from a cross-referenced review of stock agencies,
 * editorial/wire services, microstock, vector/POD marketplaces, aggregators,
 * and named trade-service competitors.
 */

// 1. Microstock & general stock photo marketplaces (global + regional)
const STOCK_MARKETPLACES = [
  "stock.adobe.com", "adobe.com/stock", "adobestock", "ftcdn.net", "adobe.com",
  "shutterstock.com", "shutterstock", "gettyimages.com", "gettyimages",
  "istockphoto.com", "istock.com", "istockphoto", "alamy.com", "alamy",
  "depositphotos.com", "depositphotos", "123rf.com", "dreamstime.com", "dreamstime",
  "bigstockphoto.com", "bigstock.com", "pond5.com", "canstockphoto.com", "canstock.com",
  "photodune.net", "picfair.com", "eyeem.com", "twenty20.com", "stocksy.com",
  "westend61.de", "masterfile.com", "vectorstock.com", "freepik.com", "vecteezy.com",
  "rawpixel.com", "agefotostock.com", "agefoto.com", "colourbox.com",
  "thinkstockphotos.com", "fotolia.com", "crestock.com", "fotosearch.com",
  "superstock.com", "megapixl.com", "stockphotos.com", "photocase.com", "photocase.de",
  "panthermedia.net", "zoonar.com", "mostphotos.com", "scopio.io", "snapwire.co",
  "wirestock.io", "stockfresh.com", "imagesbazaar.com", "dinodia.com",
  "pixtastock.com", "pixta.jp", "imagenavi.jp", "amanaimages.com", "aflo.com",
  "photo-ac.com", "imagemore.com.tw", "crushpixel.com", "yayimages.com",
  "focusedcollection.com", "prostockstudio.com", "gograph.com", "clipdealer.com",
  "imago-images.com", "imago-images.de", "f1online.de", "mauritius-images.com",
  "imagebroker.com", "imagebroker.de", "glowimages.com", "blendimages.com",
  "cultura-images.com", "corbisimages.com", "corbis.com", "sciencephoto.com",
  "spl.co.uk", "biosphoto.com", "hemis.fr", "photononstop.com", "sciencesource.com",
  "stockbyte.com", "comstock.com", "ingimage.com", "inmagine.com", "photl.com",
  "stockvault.net", "purestock.com", "jupiterimages.com", "photos.com",
  "robertharding.com", "robert-harding.com", "tetraimages.com", "cavanimages.com",
  "tandemstock.com", "gallerystock.com", "plainpicture.com", "arcangel.com",
  "trevillion.com", "offset.com", "wavebreakmedia.com", "deagostini.com",
  "akg-images.com", "mirrorpix.com", "topfoto.co.uk", "maryevans.com", "lookphotos.com",
];

// 2. Premium / rights-managed & fine-art photo agencies
const PREMIUM_AGENCIES = [
  "magnumphotos.com", "natgeoimagecollection.com", "nationalgeographic.com",
  "viiphoto.com", "panos.co.uk", "reduxpictures.com", "naturepl.com",
  "bridgemanimages.com", "bridgeman.co.uk", "artres.com", "gamma-rapho.com",
  "roger-viollet.fr", "hollandse-hoogte.nl", "laif.de", "anzenberger.com",
  "agencevu.com", "noorimages.com", "cosmosphoto.com", "everett-collection.com",
  "everettcollection.com", "granger.com", "lebrecht.co.uk", "camerapress.com",
  "eyevine.com", "aurora-photos.com", "trunkarchive.com", "artpartner.com",
  "sime.it", "huber-images.de", "schapowalow.de", "ullsteinbild.de", "akgimages.de",
];

// 3. News / editorial wire & paparazzi agencies (highest litigation risk)
const EDITORIAL_WIRE = [
  "reuters.com", "reutersconnect.com", "apimages.com", "afp.com", "afpforum.com",
  "epaimages.com", "dpa.com", "picture-alliance.com", "paphotos.com",
  "pamediagroup.com", "zumapress.com", "zuma.com", "sipausa.com", "sipaphoto.com",
  "splashnews.com", "backgrid.com", "grosbygroup.com", "coleman-rayner.com",
  "megaagency.com", "x17online.com", "bauergriffin.com", "instarimages.com",
  "startraksphoto.com", "wenn.com", "avalon.red", "cover-images.com",
  "capitalpictures.com", "featureflash.com", "goffphotos.com", "flynetpictures.com",
  "matrixpictures.co.uk", "xposurephotos.com", "planetphotos.co.uk",
  "pacificcoastnews.com", "fameflynet.com", "newscom.com", "newscast.co.uk",
  "abaca.press", "abacapress.com", "bestimage.fr", "kcspresse.com",
  "actionpress.de", "imagoeconomica.it", "ansa.it", "shutterstockeditorial.com",
  "wireimage.com", "filmmagic.com", "redferns.com", "invision.com", "upi.com",
  "polarisimages.com", "tass.com", "tass.ru", "sputnikimages.com", "ria.ru",
  "kyodonews.net", "xinhuanet.com", "imaginechina.com", "vcg.com", "belgaimage.be",
  "dukas.com", "keystone.ch", "keystone-sda.ch", "mediadrumworld.com",
  "catersnews.com", "swns.com", "solent.co.uk", "rexfeatures.com", "rex-features.com",
];

// 4. Stock video / footage sites that also sell stills
const STOCK_VIDEO = [
  "videoblocks.com", "storyblocks.com", "videohive.net", "motionelements.com",
  "dissolve.com", "filmsupply.com", "artgrid.io", "artlist.io", "mazwai.com",
  "footagefirm.com", "videezy.com", "framepool.com", "naturefootage.com",
  "clipcanvas.com", "revostock.com", "footage.net", "stockfootage.com",
  "beachfrontbroll.com", "actionvfx.com",
];

// 5. Vector / illustration / icon marketplaces (watermarked previews)
const VECTOR_ICON = [
  "iconfinder.com", "flaticon.com", "thenounproject.com", "nounproject.com",
  "streamlinehq.com", "icons8.com", "iconscout.com", "dryicons.com",
  "iconarchive.com", "glyphicons.com", "graphicriver.net", "creativefabrica.com",
  "designcuts.com", "brusheezy.com", "vexels.com", "pngtree.com", "lovepik.com",
  "cleanpng.com", "kisspng.com", "pngegg.com", "freeiconspng.com", "seekpng.com",
  "pngimg.com", "pngwing.com", "pikbest.com", "uihut.com", "ui8.net",
  "dribbble.com", "behance.net", "ouch.pics", "thehungryjpeg.com",
  "designbundles.net", "vectorportal.com", "clipart-library.com", "clipartof.com",
];

// 6. Print-on-demand & design marketplaces (artist/brand watermarks)
const PRINT_ON_DEMAND = [
  "redbubble.com", "society6.com", "zazzle.com", "teepublic.com", "teespring.com",
  "threadless.com", "displate.com", "inprnt.com", "saatchiart.com",
  "fineartamerica.com", "pixels.com", "artstation.com", "deviantart.com",
  "etsy.com", "creativemarket.com", "fontbundles.net", "spoonflower.com",
  "printful.com", "printify.com", "cafepress.com", "artfinder.com",
  "posterlounge.com", "allposters.com", "juniqe.com", "desenio.com",
  "photowall.com", "curioos.com", "artflakes.com", "imagekind.com",
  "ebay.com", "ebayimg.com", "aliexpress.com",
];

// 7. Design asset, mockup & template marketplaces
const DESIGN_ASSETS = [
  "envato.com", "elements.envato.com", "themeforest.net", "audiojungle.net",
  "placeit.net", "uistore.design", "mockupworld.co", "mockups-design.com",
  "ls.graphics", "lstore.graphics", "pixeden.com", "medialoot.com",
  "graphicburger.com", "uplabs.com", "mrmockup.com", "yellowimages.com",
  "smartmockups.com", "craftwork.design", "setproduct.com", "slidesgo.com",
  "slidescarnival.com",
];

// 8. "Looks free, isn't" — attribution-required / mixed-license hosts
const MIXED_LICENSE = [
  "flickr.com", "staticflickr.com", "500px.com", "1x.com", "viewbug.com",
  "gurushots.com", "ipernity.com", "smugmug.com", "photobucket.com",
  "wikimedia.org", "wikipedia.org", "wikiart.org", "foter.com",
  "everystockphoto.com",
];

// 9. Aggregators / re-hosts of others' watermarked images
const AGGREGATORS = [
  "pinterest.com", "pinimg.com", "pinterest.co.uk", "pinterest.fr",
  "weheartit.com", "tumblr.com", "wallhaven.cc", "wallpaperaccess.com",
  "wallpapercave.com", "wallpaperflare.com", "hdwallpapers.in",
  "wallpaperbetter.com", "wallpapersden.com", "wallpapersafari.com", "peakpx.com",
  "hipwallpaper.com", "4kwallpapers.com", "wallup.net", "wallpapertip.com",
  "getwallpapers.com", "wallpapershome.com", "pxfuel.com", "publicdomainq.net",
  "imgur.com", "picclick.com", "favim.com", "zerochan.net", "pixiv.net",
  "fandom.com", "wikia.nocookie.net", "slideshare.net", "slideplayer.com",
  "scribd.com", "issuu.com", "youtube.com", "vimeo.com", "wallpapertag.com",
];

// 10. Named trade-service SaaS + UK competitors whose photos carry their own
//     logo (brand-poison a local-service client site). Carried over from the
//     hardened ERL video pipeline blacklist.
const TRADE_COMPETITORS = [
  "fieldedge.com", "housecallpro.com", "servicetitan.com", "jobber.com",
  "getjobber.com", "fieldpulse.com", "workiz.com", "fieldcomplete.com",
  "mhelpdesk.com", "sortscape.com", "profitrhino.com", "plumbermag.com",
  "plumbingperspective.com", "contractorplus.app", "synchroteam.com",
  "homecure", "homecureplumbing", "londoncityplumber", "pimlicoplumbers",
  "247plumber", "plumbnationonline", "anyplumber", "mrlondonplumber",
  "fastfixplumbing", "247emergencyplumbers", "ovoenergy", "britishgas.co.uk",
  "boilerguide", "hometree", "checkatrade", "ratedpeople", "mybuilder.com",
  "rightio", "drainforce", "metroplumb", "manmaid", "warmzilla", "boxt.co.uk",
  "heatable", "octopus.energy", "viessmann", "ideal-boilers", "worcester-bosch",
  "vaillant.co.uk", "baxi.co.uk", "glow-worm", "adey.com", "fernox.com",
  "sentinelprotects", "trustpilot.com",
];

// 11. Junk / non-photo assets
const JUNK = [
  "favicon", "logo-only", "pixel.gif", "spacer.gif", "gravatar.com",
  "googleusercontent.com/a/",
];

// Watermark / stock URL-path substrings — catch hotlinked CDN copies whose host
// itself passed. Kept conservative: broad tokens like /thumb/, /small/, /medium/
// are excluded because legitimate CDNs use them for plain resized images.
export const WATERMARK_PATTERNS = [
  "watermark", "watermarked", "/comp/", "_comp.", "-comp.", "/wm/", "-wm.",
  "_wm.", "stock-photo", "stock-image", "stock-vector", "royalty-free",
  "with-watermark", "_preview_watermark",
];

// Genuinely-free / CC0 hosts. Matched on HOSTNAME and always allowed through,
// overriding every block rule above.
export const ALLOW_HOSTS = [
  "unsplash.com", "images.unsplash.com", "pexels.com", "pixabay.com",
  "burst.shopify.com", "kaboompics.com", "gratisography.com", "lifeofpix.com",
  "picjumbo.com", "stocksnap.io", "reshot.com", "nappy.co", "isorepublic.com",
  "freestocks.org", "negativespace.co", "skitterphoto.com", "jeshoots.com",
  "magdeleine.co", "foodiesfeed.com", "barnimages.com", "splitshire.com",
  "freerangestock.com", "publicdomainpictures.net", "publicdomainarchive.com",
  "rgbstock.com", "cc0.photo", "pikwizard.com", "openverse.org",
  "undraw.co", "openclipart.org", "publicdomainvectors.org", "svgsilh.com",
];

export const BLOCKED_DOMAINS = [
  ...STOCK_MARKETPLACES, ...PREMIUM_AGENCIES, ...EDITORIAL_WIRE, ...STOCK_VIDEO,
  ...VECTOR_ICON, ...PRINT_ON_DEMAND, ...DESIGN_ASSETS, ...MIXED_LICENSE,
  ...AGGREGATORS, ...TRADE_COMPETITORS, ...JUNK,
];

const BLOCKED = [...new Set([...BLOCKED_DOMAINS, ...WATERMARK_PATTERNS].map((d) => d.toLowerCase()))];
const ALLOW = ALLOW_HOSTS.map((d) => d.toLowerCase());

function hostname(url) {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return "";
  }
}

/** True if a URL matches a blocked domain or watermark pattern (and is not allow-listed). */
export function isBlocked(url) {
  const host = hostname(url);
  if (host && ALLOW.some((d) => host === d || host.endsWith("." + d))) {
    return false;
  }
  const lower = url.toLowerCase();
  return BLOCKED.some((d) => lower.includes(d));
}
