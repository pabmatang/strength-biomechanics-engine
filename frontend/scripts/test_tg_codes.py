import urllib.request

headers = {'User-Agent': 'Mozilla/5.0'}
base_dw = "https://webapi-prod.technogym.com/dw/image/v2/BFLQ_PRD/on/demandware.static/-/Sites-tg-catalog-master/default/"
base_feed = "https://www.technogym.com/es-ES/feed/images/"

codes = ['MNDP', 'MN5P', 'MN9P', 'MNVP', 'MNEP', 'MNFP', 'MNHP', 'MNLP', 'MNMP', 'MNPP', 'MNRP', 'MNTP', 'MK55', 'MG55', 'M955', 'M755']

for c in codes:
    url = f"{base_feed}{c}/"
    # also try direct names
    test_urls = [
        f"{base_feed}{c}/selection-900-seated-dip-plp.jpg",
        f"{base_feed}{c}/selection-700-seated-dip-plp.jpg",
        f"{base_feed}{c}/selection-900-dip-plp.jpg",
        f"{base_feed}{c}/selection-700-dip-plp.jpg",
        f"{base_feed}{c}/selection-900-triceps-plp.jpg",
        f"{base_feed}{c}/selection-900-wide-row-plp.jpg",
        f"{base_feed}{c}/selection-700-wide-row-plp.jpg",
        f"{base_feed}{c}/selection-900-row-plp.jpg",
    ]
    for u in test_urls:
        try:
            req = urllib.request.Request(u, headers=headers)
            with urllib.request.urlopen(req, timeout=3) as r:
                if r.status == 200:
                    print(f"FOUND: {u} ({len(r.read())} bytes)")
        except:
            pass
