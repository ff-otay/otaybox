using System;
using System.Drawing;
using System.Drawing.Imaging;

class Program
{
    static void Main(string[] args)
    {
        string input = args[0];
        string output = args[1];
        using (Bitmap bmp = new Bitmap(input))
        {
            int minX = bmp.Width, minY = bmp.Height, maxX = 0, maxY = 0;
            for (int y = 0; y < bmp.Height; y++)
            {
                for (int x = 0; x < bmp.Width; x++)
                {
                    if (bmp.GetPixel(x, y).A > 10) // threshold alpha
                    {
                        if (x < minX) minX = x;
                        if (x > maxX) maxX = x;
                        if (y < minY) minY = y;
                        if (y > maxY) maxY = y;
                    }
                }
            }
            if (minX > maxX || minY > maxY) return; 
            
            int width = maxX - minX + 1;
            int height = maxY - minY + 1;
            int size = Math.Max(width, height);
            int pX = (size - width) / 2;
            int pY = (size - height) / 2;
            
            int padding = (int)(size * 0.05);
            int finalSize = size + padding * 2;
            
            using (Bitmap cropped = new Bitmap(finalSize, finalSize))
            {
                using (Graphics g = Graphics.FromImage(cropped))
                {
                    g.Clear(Color.Transparent);
                    g.DrawImage(bmp, new Rectangle(padding + pX, padding + pY, width, height), new Rectangle(minX, minY, width, height), GraphicsUnit.Pixel);
                }
                cropped.Save(output, ImageFormat.Png);
            }
        }
    }
}
