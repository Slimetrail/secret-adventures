# Own-made icon: a glowing doorway at the end of a stone corridor, drawn with PIL shapes.
from PIL import Image,ImageDraw,ImageFilter
def icon(s,pad):
  im=Image.new("RGB",(s,s),(26,16,48));d=ImageDraw.Draw(im);c=s/2;i=pad
  for k in range(6):
    t=i+(c-i)*k/7;col=(60+k*18,40+k*10,100+k*20);d.rectangle([t,t,s-t,s-t],outline=(15,8,30),fill=col,width=max(1,s//128))
  g=Image.new("RGB",(s,s));gd=ImageDraw.Draw(g);gd.ellipse([c-s*.16,c-s*.2,c+s*.16,c+s*.2],fill=(255,210,120));g=g.filter(ImageFilter.GaussianBlur(s/25))
  im=Image.blend(im,Image.composite(g,im,g.convert("L")),0.9);d=ImageDraw.Draw(im)
  d.rectangle([c-s*.07,c-s*.1,c+s*.07,c+s*.12],fill=(255,235,180),outline=(40,20,10),width=max(1,s//96))
  return im
icon(192,6).save("icons/icon-192.png");icon(512,16).save("icons/icon-512.png");icon(512,70).save("icons/maskable-512.png")
