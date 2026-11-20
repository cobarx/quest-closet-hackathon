IMG = "https://static.prod-images.emergentagent.com/jobs/33ff85bf-49f6-42d5-8a74-502778b34535/images/"


PRODUCT_FIELDS = ("id", "name", "category", "price", "gender", "color", "aesthetic", "rarity", "seller", "material", "description", "tags", "image")


def _p(*values):
    item = dict(zip(PRODUCT_FIELDS, values, strict=True))
    return item | {"image": IMG + item["image"] + ".jpeg", "currency": "USD", "in_stock": True}


SEED_PRODUCTS = [
    _p("helm-black-barbute", "Blackened Barbute Helmet", "helmet", 68, "unisex", "black", "dark", "rare", "Gallows & Forge Guild", "16-gauge blackened steel, brass rivets",
       "T-visor barbute with a padded coif inside. Battle-ready and stage-combat safe.", ["knight", "steel", "visor"], "f44698617b3add663e43b526973b121a27700d5bd3901fcc9d0b480c7206daac"),
    _p("helm-leather-cowl", "Shadow Leather Cowl", "helmet", 29, "unisex", "black", "dark", "common", "Shadowstep Leather", "Oiled black leather",
       "Close-fitting hooded cowl with laced seams. A rogue's best friend.", ["rogue", "assassin", "hood"], "6f2f98dbdd5d004d12aa513572670de833c424bbc811cec880ddb56d4f671822"),
    _p("helm-silver-sallet", "Polished Silver Sallet", "helmet", 95, "unisex", "silver", "light", "epic", "Ironcrest Armory", "Mirror-polished steel",
       "Gleaming sallet with articulated visor, built for paladins and tournament knights.", ["knight", "paladin", "steel"], "1cd685ffb790c32a904ae1566fe68a95672692a7f99a55127091554e06e56ad2"),
    _p("helm-norse-horned", "Horned Norse Spangenhelm", "helmet", 54, "men", "bronze", "neutral", "rare", "Fjordhammer Smithy", "Iron & bronze, riveted chainmail aventail",
       "Spangenhelm with nasal guard, curved horns and mail neck guard.", ["viking", "barbarian", "horns"], "1187a5ba824942047a1d79f0dd7a3ec0d29b722ca9c92581456532062eb79375"),
    _p("helm-elven-circlet", "Moonstone Elven Circlet", "helmet", 38, "women", "silver", "light", "uncommon", "Sylvian Loom", "Silver-plated brass, moonstone",
       "Leaf filigree circlet set with a glowing moonstone.", ["elf", "jewelry", "noble"], "39b6917867625ccfb5f1dcee8ce056e7e8b68bb324d7d8a7a0dfc2531ae54f9a"),
    _p("armor-gothic-cuirass", "Gothic Plate Cuirass", "armor", 145, "unisex", "silver", "light", "epic", "Ironcrest Armory", "18-gauge fluted steel",
       "Fluted breast and back plate with adjustable leather straps.", ["knight", "paladin", "plate"], "44a8ed9861bd8e903ddb23f461ec5e90066ac138404d76fc6c48be528555fb7f"),
    _p("armor-black-brigandine", "Blackened Brigandine", "armor", 112, "unisex", "black", "dark", "rare", "Gallows & Forge Guild", "Leather over riveted steel plates",
       "Dark brigandine vest with hundreds of steel rivets. Death-knight approved.", ["dark knight", "mercenary"], "dfc08c1eb5421e9492b7d7be336844a0192eb62e148961ac91e7541ade7603d0"),
    _p("armor-studded-jerkin", "Studded Leather Jerkin", "armor", 59, "unisex", "brown", "neutral", "uncommon", "Old Oak Tanner", "Veg-tan leather, iron studs",
       "Buckled ranger jerkin, light enough for long woodland campaigns.", ["ranger", "rogue", "leather"], "fd282cd6010071f45fb77df888f52a00e736d44b8419cb9452492bda3a3ae358"),
    _p("armor-elven-scale", "Elven Scale Corset", "armor", 88, "women", "gold", "light", "epic", "Sylvian Loom", "Gold-tone scales on green leather",
       "Fitted scale corset with lace-up front. Elegant and battle-ready.", ["elf", "warrior", "scale"], "5a7f7f404c58c2307c8ed6d82502fb302f35aca72cab30ad6e3471aa671979a3"),
    _p("armor-chainmail", "Riveted Chainmail Hauberk", "armor", 129, "unisex", "silver", "neutral", "rare", "Ironcrest Armory", "Riveted steel rings",
       "Short-sleeved hauberk, wear over a gambeson or tunic.", ["knight", "soldier", "mail"], "5c149033104422323011878afbb7b08ff499ab47d055832f61b849b973d8db3e"),
    _p("cloak-shadow-ranger", "Shadow Ranger Cloak", "cloak", 42, "unisex", "black", "dark", "uncommon", "Woven Mist Outfitters", "Weatherproof wool blend",
       "Heavy hooded cloak with a forged iron clasp.", ["ranger", "rogue", "hood"], "95fe08c4e583763d7eb25c90a9ee6873a5f36af2001aa643b6929f59ad706db9"),
    _p("cloak-white-templar", "White Templar Mantle", "cloak", 47, "unisex", "white", "light", "uncommon", "Knights Hospitaller Depot", "Cotton canvas",
       "Ivory mantle bearing a red cross on the shoulder.", ["templar", "paladin", "crusader"], "615ae758bcee85e694adc837e5a741f9d81a7e9230ddc1fac05d4f8ca68f0e04"),
    _p("cloak-crimson-velvet", "Crimson Velvet Cape", "cloak", 64, "unisex", "red", "dark", "rare", "House Valemont Tailors", "Crushed velvet, gold chain",
       "Floor-length noble cape with a gold chain clasp.", ["noble", "vampire", "royal"], "bede9a345394e6bb0cd608f70eb68f8d550c7ea8fd71c03a737b7b98c65168f6"),
    _p("cloak-wolf-pelt", "Wolf Pelt Mantle", "cloak", 79, "men", "brown", "neutral", "rare", "Fjordhammer Smithy", "Faux fur, suede",
       "Barbarian mantle with a thick faux-fur collar.", ["viking", "barbarian", "fur"], "8c3cee39655f4610f898304102e074d51afb1effb3996d8aeff1d71335afa3a5"),
    _p("tunic-elven-dress", "Elven Embroidered Dress", "tunic", 49, "women", "green", "light", "rare", "Sylvian Loom", "Emerald linen, gold embroidery",
       "Flowing tunic dress with flared woodland sleeves.", ["elf", "druid", "dress"], "6d1df93d637cbc3851a1938490e8941930918c31f37d4460ae053a9591d14ed9"),
    _p("tunic-linen-peasant", "Linen Peasant Tunic", "tunic", 24, "unisex", "beige", "light", "common", "Cobblestone Crafts", "Undyed linen",
       "Simple lace-neck tunic. The base layer of every adventurer.", ["peasant", "basic", "layer"], "3f498a8f4d8a60ff077bb6ddcea8f3883abff7773ea219d510cb8f60a01adfc4"),
    _p("tunic-black-gambeson", "Black Quilted Gambeson", "tunic", 72, "unisex", "black", "dark", "uncommon", "Shadowstep Leather", "Quilted cotton, leather toggles",
       "Padded gambeson with leather toggles. Great under mail.", ["assassin", "soldier", "padded"], "24a0990793e49185a266602f62f87028e22cbbd9018c8b31bb5d24d4d16d5116"),
    _p("tunic-blue-doublet", "Royal Blue Doublet", "tunic", 85, "men", "blue", "light", "rare", "House Valemont Tailors", "Velvet, silver buttons",
       "Renaissance noble doublet with silver trim.", ["noble", "bard", "royal"], "8227c951dae01eb2a67ee142e18ecb7b2a9a662ab976b0450214248068fc5083"),
    _p("tunic-witch-robe", "Hexweaver Witch Robe", "tunic", 58, "women", "purple", "dark", "rare", "Moonhollow Coven", "Layered cotton gauze",
       "Hooded purple robe with tattered sleeves and silver runes.", ["witch", "mage", "robe"], "8867364cf21db86f4497574d819b5fdc2c884031e21d9b315e632c7420180579"),
    _p("boots-black-riding", "Black Riding Boots", "boots", 65, "unisex", "black", "dark", "uncommon", "Cobblestone Crafts", "Full-grain leather",
       "Knee-high boots with triple buckles and grippy soles.", ["rogue", "knight", "leather"], "82ab1fcca2a8bda1583f47c92fc60ca968c61a55b42f4582c98f6778c10a76ad"),
    _p("boots-suede-ankle", "Wanderer's Suede Boots", "boots", 36, "unisex", "brown", "neutral", "common", "Cobblestone Crafts", "Suede, rubber sole",
       "Folded ankle boots for long hikes between camps.", ["ranger", "peasant", "travel"], "aa5a4e28a7fe395da4cd1399785fd917fdff850ea27f116c7edac3182c17bd57"),
    _p("boots-steel-sabatons", "Steel Greaves & Sabatons", "boots", 99, "unisex", "silver", "light", "epic", "Ironcrest Armory", "Polished steel",
       "Articulated leg armor with pointed sabatons.", ["knight", "paladin", "plate"], "9ccf2f199b014bc552295872d9f6220751954b43cb1094961c772279d35d6d4f"),
    _p("weapon-foam-longsword", "Foam Core Longsword", "weapon", 45, "unisex", "silver", "light", "uncommon", "Safe Strike LARP", "Latex over foam, fiberglass core",
       "LARP-safe longsword with leather wrapped hilt.", ["knight", "sword"], "381f861cb35f38b284c044fd1ad1416f6722a29066a2162949b2283a89db2a1d"),
    _p("weapon-obsidian-dagger", "Obsidian Latex Dagger", "weapon", 22, "unisex", "black", "dark", "common", "Safe Strike LARP", "Latex, foam",
       "Curved black dagger, coreless and throw-safe.", ["assassin", "rogue", "dagger"], "4b6b30a9d8e54094c3d2346f0a00e40792191cd200e47d8a754d584cf278dc34"),
    _p("weapon-elven-bow", "Carved Elven Recurve Bow", "weapon", 89, "unisex", "brown", "light", "rare", "Sylvian Loom", "Laminated wood, 20lb draw",
       "Leaf-carved recurve bow, LARP-legal with foam arrows.", ["elf", "ranger", "bow"], "4daea68e2f16faa6ec27bdfab85405c515bd68632b3d54d2efd67e6b00ca5967"),
    _p("weapon-arcane-staff", "Arcane Crystal Staff", "weapon", 57, "unisex", "purple", "dark", "epic", "Moonhollow Coven", "Foam-carved wood look, resin crystal",
       "Twisted staff crowned with an amethyst crystal.", ["mage", "witch", "staff"], "ad8d3b5d6ba7da8487dd0c66d08215c2f64686d328e94dd75df6213d313ff856"),
    _p("shield-heraldic-kite", "Heraldic Kite Shield", "shield", 54, "unisex", "white", "light", "rare", "Knights Hospitaller Depot", "Foam-edged birch ply",
       "White kite shield with red battle cross.", ["templar", "knight", "crusader"], "debcde7e0e9a81346b7abfe90d4eeda9055b7b00eae2e35413094bbfc3c6dfb5"),
    _p("shield-black-round", "Black Iron Round Shield", "shield", 49, "unisex", "black", "dark", "uncommon", "Fjordhammer Smithy", "Wood look foam, iron boss",
       "Viking round shield with blackened boss and rim.", ["viking", "barbarian"], "d3315dd1748abde91bcaa6de85bb652d114cebad31e7f7cc58d80052081b2b1f"),
    _p("acc-leather-belt", "Tooled Belt & Pouch", "accessory", 28, "unisex", "brown", "neutral", "common", "Old Oak Tanner", "Veg-tan leather, brass",
       "Knotwork belt with a hanging coin pouch.", ["ranger", "merchant", "belt"], "3b3d97f66b7415dd40e10d92c3c3260d0ce996f53c7d9f35da778c61bb48749b"),
    _p("acc-steel-bracers", "Etched Steel Bracers", "accessory", 34, "unisex", "silver", "neutral", "uncommon", "Ironcrest Armory", "Etched steel, leather straps",
       "Forearm guards etched with Nordic knotwork.", ["warrior", "viking"], "e53ad4d9da6d7e515bde286519719bc3ae0304854ffd26b98f9b3f0436656f4e"),
    _p("acc-raven-amulet", "Raven Skull Amulet", "accessory", 19, "unisex", "black", "dark", "common", "Moonhollow Coven", "Cast resin, waxed cord",
       "Gothic raven skull pendant for necromancers and witches.", ["witch", "necromancer", "jewelry"], "bb363104f5217dfc079ad9400c5f386c5a62a2420c720673a6ce4e00c8e04bd7"),
    _p("acc-gold-gauntlets", "Gilded Filigree Gauntlets", "accessory", 76, "unisex", "gold", "light", "legendary", "House Valemont Tailors", "Gold-plated steel",
       "Ornate articulated gauntlets fit for a paladin lord.", ["paladin", "royal", "gauntlets"], "f68984e99700abae06bcf085344e49bcb66eec2499155e2992b1fe25d04bff59"),
]


def _s(sizes, fit, length, measurements, **flags):
    (h_min, h_max), (w_min, w_max) = fit
    return {"sizes": sizes, "min_height_cm": h_min, "max_height_cm": h_max, "min_weight_kg": w_min, "max_weight_kg": w_max,
            "length_cm": length, "measurements": measurements, "adjustable": flags.get("adjustable", False),
            "one_of_a_kind": flags.get("one_off", False), "notes": flags.get("notes", "")}


ANY_H, ANY_W = (140, 210), (35, 160)
SIZING = {
    "helm-black-barbute": _s(["M", "L"], ((150, 205), (45, 140)), 30, "Head circ. 56-61 cm", adjustable=True, notes="Padded liner adjusts the fit"),
    "helm-leather-cowl": _s(["S", "M", "L"], ((145, 205), (40, 150)), 45, "Head circ. 54-60 cm", adjustable=True, notes="Laced back"),
    "helm-silver-sallet": _s(["L"], ((165, 205), (55, 140)), 32, "Head circ. 59-62 cm", one_off=True, notes="Hand-forged single piece"),
    "helm-norse-horned": _s(["M"], ((160, 200), (55, 140)), 28, "Head circ. 57-59 cm", one_off=True, notes="One-off smith build"),
    "helm-elven-circlet": _s(["One size"], (ANY_H, ANY_W), None, "Adjustable 52-60 cm", adjustable=True),
    "armor-gothic-cuirass": _s(["M", "L"], ((168, 195), (65, 105)), 48, "Chest 96-112 cm", adjustable=True, notes="Side straps adjust ~8 cm"),
    "armor-black-brigandine": _s(["L", "XL"], ((175, 200), (75, 125)), 55, "Chest 104-124 cm", adjustable=True),
    "armor-studded-jerkin": _s(["S", "M", "L", "XL"], ((155, 200), (50, 115)), 62, "Chest 86-120 cm", adjustable=True),
    "armor-elven-scale": _s(["XS", "S", "M"], ((150, 178), (45, 75)), 38, "Waist 60-78 cm", adjustable=True, notes="Lace-up front"),
    "armor-chainmail": _s(["L"], ((170, 198), (65, 120)), 78, "Chest up to 118 cm", one_off=True, notes="Hand-riveted, only one in stock"),
    "cloak-shadow-ranger": _s(["One size"], ((155, 200), (45, 140)), 135, "Shoulder clasp, fits most", adjustable=True),
    "cloak-white-templar": _s(["M", "L"], ((165, 200), (55, 130)), 120, "Shoulders 42-52 cm"),
    "cloak-crimson-velvet": _s(["One size"], ((160, 200), (45, 140)), 150, "Floor length for 170-185 cm", adjustable=True),
    "cloak-wolf-pelt": _s(["L"], ((172, 205), (70, 140)), 95, "Shoulders up to 55 cm", one_off=True, notes="Unique fur pattern"),
    "tunic-elven-dress": _s(["S", "M"], ((155, 175), (45, 72)), 140, "Bust 82-94 cm"),
    "tunic-linen-peasant": _s(["S", "M", "L", "XL", "XXL"], ((150, 205), (45, 140)), 80, "Chest 90-130 cm"),
    "tunic-black-gambeson": _s(["M", "L", "XL"], ((165, 200), (60, 120)), 75, "Chest 98-122 cm"),
    "tunic-blue-doublet": _s(["M"], ((170, 185), (62, 85)), 68, "Chest 98-104 cm", one_off=True, notes="Tailored commission piece"),
    "tunic-witch-robe": _s(["One size"], ((150, 185), (45, 110)), 145, "Wrap-tie waist", adjustable=True),
    "boots-black-riding": _s(["S", "M", "L"], ((150, 200), (40, 140)), 42, "EU 38-46, shaft 42 cm"),
    "boots-suede-ankle": _s(["S", "M", "L", "XL"], ((145, 205), (40, 150)), 18, "EU 37-47"),
    "boots-steel-sabatons": _s(["M"], ((170, 188), (55, 120)), 55, "Calf 36-42 cm, EU 42-44", adjustable=True, one_off=True, notes="Articulated, made for one wearer"),
    "weapon-foam-longsword": _s(["One size"], (ANY_H, ANY_W), 110, "Blade 85 cm, 1.1 kg"),
    "weapon-obsidian-dagger": _s(["One size"], (ANY_H, ANY_W), 35, "Blade 22 cm"),
    "weapon-elven-bow": _s(["One size"], ((155, 210), (40, 160)), 150, "20 lb draw at 28 in", one_off=True, notes="Hand-carved"),
    "weapon-arcane-staff": _s(["One size"], (ANY_H, ANY_W), 165, "Height 165 cm"),
    "shield-heraldic-kite": _s(["One size"], (ANY_H, ANY_W), 90, "90 x 55 cm"),
    "shield-black-round": _s(["One size"], (ANY_H, ANY_W), 70, "Diameter 70 cm"),
    "acc-leather-belt": _s(["S", "M", "L", "XL"], ((145, 205), (40, 150)), 115, "Waist 70-110 cm", adjustable=True),
    "acc-steel-bracers": _s(["One size"], (ANY_H, ANY_W), 22, "Forearm 24-30 cm", adjustable=True),
    "acc-raven-amulet": _s(["One size"], (ANY_H, ANY_W), 60, "Cord 60 cm"),
    "acc-gold-gauntlets": _s(["M", "L"], ((160, 205), (50, 140)), 30, "Hand width 8-10 cm", one_off=True, notes="Only pair forged"),
}
for _item in SEED_PRODUCTS:
    _item["sizing"] = SIZING[_item["id"]]

NEW = {
    "shoes_turnshoes": "3077db4a3ceaf514d08b3d8556828c86000afca5340bd05fa2cb9c7227f309f2", "shoes_elven": "962bcdf9496b9f5e28284d6fc75012aba1e06244057622a65d4efb2b1e008fbb",
    "mk_elf_ears": "8a3bec1f5bc15159e1b271e6bb8651b5d866f37ec813e38ecf4a65b449480d24", "mk_woad": "7de5646e5e02893c1c5a60bca5189c7fe9d05beea553e2ec7587ecc32785b1f8",
    "mk_orc": "61c379f7c3be2eb10344fe949647e373741bfd616534fe3a790075d758cee6fd", "mk_scar": "4e1825787ba29fb94655059d92965da35c1968daf24e9276c66702163f49735e",
    "mk_vampire": "0598cb83ebdbd5954a737d961af5ded128709b21be1f1afc1ee78ee41cb9f68e", "cp_tent": "6a5e937c93560c0fe37b3178d8a81fdda8424e20bd0a5927c54f86e735892ee9",
    "cp_lantern": "4f08c1dafa257fc89cbd5933b7f2b8ae94a362c7b27a1808a4acadde6ef85a32", "cp_bedroll": "0d3ec1a5e2183be116396ab6b36b47e1b539fd0f32c4968615ebd878b2314cef",
}
ONE = _s(["One size"], (ANY_H, ANY_W), None, "Fits all")
EXTRA_PRODUCTS = [
    (_p("boots-leather-turnshoes", "Hand-Stitched Turnshoes", "boots", 58, "unisex", "brown", "neutral", "uncommon", "Cobbler's Hollow", "Vegetable-tanned leather",
        "Period turnshoes with wrap straps. Soft sole for long days on the field.", ["peasant", "ranger", "medieval"], NEW["shoes_turnshoes"]),
     _s(["S", "M", "L", "XL"], (ANY_H, ANY_W), 12, "EU 38-46", notes="Order your street size")),
    (_p("boots-elven-suede", "Elven Leaf Suede Boots", "boots", 82, "women", "green", "light", "rare", "Silverbough Atelier", "Suede with embossed leather",
        "Knee-high lace-up boots with leaf embossing. Light, quiet and woodland-ready.", ["elf", "ranger", "woodland"], NEW["shoes_elven"]),
     _s(["S", "M"], ((150, 180), (40, 85)), 42, "EU 36-40", one_off=True, notes="Handmade pair")),
    (_p("mk-elf-ears", "Latex Elf Ears", "makeup", 34, "unisex", "beige", "light", "common", "Glamour & Grime FX", "Soft latex",
        "Paintable pointed ear tips with spirit gum included.", ["elf", "fae", "ears"], NEW["mk_elf_ears"]), ONE),
    (_p("mk-woad-paint", "Woad Warrior Face Paint", "makeup", 24, "unisex", "blue", "neutral", "common", "Glamour & Grime FX", "Water-activated pigment",
        "Blue face paint for tribal war markings. Sweat-resistant.", ["celtic", "barbarian", "war paint"], NEW["mk_woad"]), ONE),
    (_p("mk-orc-kit", "Orc Prosthetic Kit", "makeup", 58, "unisex", "green", "dark", "rare", "Glamour & Grime FX", "Foam latex & cream paint",
        "Lower tusks, green cream paint and setting powder.", ["orc", "monster", "prosthetic"], NEW["mk_orc"]), ONE),
    (_p("mk-scar-kit", "Battle Scars & Blood Kit", "makeup", 29, "unisex", "red", "dark", "common", "Glamour & Grime FX", "Scar wax, fake blood",
        "Scar wax, fake blood and bruise wheel for veteran fighters.", ["warrior", "scar", "blood"], NEW["mk_scar"]), ONE),
    (_p("mk-vampire-set", "Vampire Fangs & Shadow Palette", "makeup", 32, "unisex", "black", "dark", "uncommon", "Nocturne Cosmetics", "Acrylic fangs, pressed pigment",
        "Custom-fit fangs and a gothic eye palette for creatures of the night.", ["vampire", "gothic", "fangs"], NEW["mk_vampire"]), ONE),
    (_p("camp-canvas-tent", "Period Canvas Wall Tent", "camping", 549, "unisex", "white", "light", "epic", "Encampment Co.", "Cotton canvas",
        "3x3 m period-correct wall tent for in-game camps.", ["camp", "tent", "medieval"], NEW["cp_tent"]), ONE),
    (_p("camp-oil-lantern", "Brass Oil Lantern", "camping", 39, "unisex", "bronze", "neutral", "common", "Encampment Co.", "Brass & glass",
        "Hurricane-style lantern with a 12 h burn time.", ["camp", "light", "lantern"], NEW["cp_lantern"]), ONE),
    (_p("camp-bedroll-pack", "Bedroll & Canvas Haversack", "camping", 119, "unisex", "brown", "neutral", "uncommon", "Encampment Co.", "Wool & waxed canvas",
        "Rolled wool bedroll with leather straps plus a period haversack.", ["camp", "bedroll", "travel"], NEW["cp_bedroll"]), ONE),
]
for _item, _sizing in EXTRA_PRODUCTS:
    _item["sizing"] = _sizing
    _item["wearable"] = _item["category"] != "camping"
    SEED_PRODUCTS.append(_item)
